import { setup, assign, fromCallback, enqueueActions } from "xstate";

interface LoginContext {
  email: string;
  password: string;
  errorMessage: string | null;
}

type LoginEvent =
  | { type: "CHANGE_EMAIL"; value: string }
  | { type: "CHANGE_PASSWORD"; value: string }
  | { type: "SUBMIT" }
  | { type: "SUCCESS" }
  | { type: "RESET" }
  | { type: "ERROR"; message: string }
  | { type: "CANCEL" };

const initContext: LoginContext = {
  email: "",
  password: "",
  errorMessage: null,
};

export interface loginFnProps {
  email: string;
  password: string;
  signal: AbortSignal;
}
// 定义可配置的action实现
export type LoginMachineActions = {
  onLoginSuccess?: () => void;
  onLoginError?: () => void;
  loginFn?: ({ email, password, signal }: loginFnProps) => Promise<unknown>;
};

// 定义提交处理逻辑
const createSubmitLogic = (customActions?: LoginMachineActions) => {
  return fromCallback(({ sendBack, input, receive }) => {
    const loginFn = customActions?.loginFn || (() => Promise.resolve());
    const { email, password } = input as loginFnProps;

    // 创建 AbortController 用于取消请求
    const abortController = new AbortController();

    // 执行异步提交操作
    loginFn({ email, password, signal: abortController.signal })
      .then(() => {
        sendBack({ type: "SUCCESS" });
      })
      .catch((error) => {
        sendBack({
          type: "ERROR",
          message: error instanceof Error ? error.message : "Login failed",
        });
      });

    // 监听取消事件
    receive((event) => {
      if (event.type === "CANCEL") {
        abortController.abort();
        console.log("event abort", abortController);
      }
    });

    // 清理函数
    return () => {
      // 可以在这里处理清理逻辑，如取消请求等
      abortController.abort();
      console.log("清理函数 abort", abortController);
    };
  });
};

// 创建状态机工厂函数，允许传入自定义actions
export const createLoginMachine = (customActions?: LoginMachineActions) => {
  const submitLogic = createSubmitLogic(customActions);

  return setup({
    types: {
      context: {} as LoginContext,
      events: {} as LoginEvent,
    },
    actions: {
      onEmailChange: assign({
        email: ({ event }) =>
          event.type === "CHANGE_EMAIL" ? event.value : "",
        errorMessage: null,
      }),
      onPasswordChange: assign({
        password: ({ event }) =>
          event.type === "CHANGE_PASSWORD" ? event.value : "",
        errorMessage: null,
      }),
      onError: enqueueActions(({ self, context }) => {
        const stateValue = self.getSnapshot().value;
        const stateSource =
          typeof stateValue === "string"
            ? stateValue
            : JSON.stringify(stateValue);

        const errorMsg = context.errorMessage ?? "unknown error";

        // 记录错误位置和消息
        console.error(`Error Message: ${errorMsg} /n Error in ${stateSource}`);
      }),
      onReset: assign({
        ...initContext,
      }),
      onLoginCancel: ({ system }) => {
        const submitActor = system.get("submitProcess");
        if (submitActor) {
          submitActor.send({ type: "CANCEL" });
        }
      },
      onLoginSuccess: customActions?.onLoginSuccess || (() => {}),
      onLoginError: customActions?.onLoginError || (() => {}),
    },
    guards: {
      hasCredentials: ({ context }) => {
        return !!context.email && !!context.password;
      },
    },
    actors: {
      submitProcess: submitLogic,
    },
  }).createMachine({
    id: "login",
    initial: "idle",
    context: {
      ...initContext,
    },
    states: {
      idle: {
        on: {
          // 邮箱改变
          CHANGE_EMAIL: {
            actions: "onEmailChange",
          },
          // 密码改变
          CHANGE_PASSWORD: {
            actions: "onPasswordChange",
          },
          // 提交
          SUBMIT: [
            {
              guard: "hasCredentials",
              target: "submitting",
            },
            {
              actions: [
                assign({
                  errorMessage: "Please provide both email and password",
                }),
                "onError",
              ],
            },
          ],
          // 重置
          RESET: {
            actions: "onReset",
          },
        },
      },
      //等待后端的鉴权
      submitting: {
        invoke: {
          systemId: "submitProcess",
          src: "submitProcess",
          input: ({ context }) => ({
            email: context.email,
            password: context.password,
          }),
        },
        on: {
          // 鉴权成功
          SUCCESS: {
            target: "success",
            actions: "onLoginSuccess",
          },
          // 鉴权失败
          ERROR: {
            target: "idle",
            actions: [
              assign({
                errorMessage: ({ event }) => event.message,
              }),
              "onError",
              "onLoginError",
            ],
          },
          // 取消提交
          CANCEL: {
            actions: "onLoginCancel",
          },
        },
        after: {
          // 15秒后自动超时
          5000: {
            target: "idle",
            actions: [
              assign({
                errorMessage: "Login timeout, please try again",
              }),
              "onError",
              // "onLoginCancel",
            ],
          },
        },
      },
      success: {
        type: "final",
      },
    },
  });
};
