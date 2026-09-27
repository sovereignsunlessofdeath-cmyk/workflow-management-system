import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const api = axios.create({
  baseURL:
    import.meta.env
      .VITE_API_BASE_URL,

  headers: {
    "Content-Type":
      "application/json",
  },
});

type RetryableRequest =
  InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

type RefreshResponse = {
  access: string;
  refresh?: string;
};

let isRefreshing =
  false;

let refreshQueue: Array<{
  resolve: (
    token: string,
  ) => void;

  reject: (
    error: unknown,
  ) => void;
}> = [];

function resolveRefreshQueue(
  error: unknown,
  token: string | null,
) {
  refreshQueue.forEach(
    ({
      resolve,
      reject,
    }) => {
      if (
        error ||
        !token
      ) {
        reject(
          error,
        );
      } else {
        resolve(
          token,
        );
      }
    },
  );

  refreshQueue = [];
}

function clearAuthentication() {
  localStorage.removeItem(
    "access_token",
  );

  localStorage.removeItem(
    "refresh_token",
  );
}

api.interceptors.request.use(
  (config) => {
    const accessToken =
      localStorage.getItem(
        "access_token",
      );

    if (
      accessToken
    ) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(
      error,
    ),
);

api.interceptors.response.use(
  (response) =>
    response,

  async (
    error: AxiosError,
  ) => {
    const originalRequest =
      error.config as
        | RetryableRequest
        | undefined;

    if (
      !originalRequest
    ) {
      return Promise.reject(
        error,
      );
    }

    const status =
      error.response
        ?.status;

    const refreshToken =
      localStorage.getItem(
        "refresh_token",
      );

    const isRefreshRequest =
      originalRequest.url?.includes(
        "/auth/refresh/",
      );

    if (
      status !== 401 ||
      originalRequest._retry ||
      isRefreshRequest ||
      !refreshToken
    ) {
      return Promise.reject(
        error,
      );
    }

    if (
      isRefreshing
    ) {
      return new Promise<string>(
        (
          resolve,
          reject,
        ) => {
          refreshQueue.push(
            {
              resolve,
              reject,
            },
          );
        },
      ).then(
        (
          newAccessToken,
        ) => {
          originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;

          return api(
            originalRequest,
          );
        },
      );
    }

    originalRequest._retry =
      true;

    isRefreshing =
      true;

    try {
      const response =
        await axios.post<RefreshResponse>(
          `${
            import.meta
              .env
              .VITE_API_BASE_URL
          }/auth/refresh/`,
          {
            refresh:
              refreshToken,
          },
        );

      const newAccessToken =
        response.data
          .access;

      const newRefreshToken =
        response.data
          .refresh;

      localStorage.setItem(
        "access_token",
        newAccessToken,
      );

      /*
       * With refresh-token rotation enabled,
       * Django may return a new refresh token.
       * We must replace the old one because
       * the previous refresh token may now
       * be blacklisted.
       */
      if (
        newRefreshToken
      ) {
        localStorage.setItem(
          "refresh_token",
          newRefreshToken,
        );
      }

      resolveRefreshQueue(
        null,
        newAccessToken,
      );

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(
        originalRequest,
      );
    } catch (
      refreshError
    ) {
      resolveRefreshQueue(
        refreshError,
        null,
      );

      clearAuthentication();

      if (
        window.location
          .pathname !==
        "/login"
      ) {
        window.location.replace(
          "/login",
        );
      }

      return Promise.reject(
        refreshError,
      );
    } finally {
      isRefreshing =
        false;
    }
  },
);

export default api;