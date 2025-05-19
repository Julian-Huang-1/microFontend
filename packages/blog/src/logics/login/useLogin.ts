import { useMachine } from "@xstate/react";
import { createLoginMachine } from "./loginMachine";
import type { LoginMachineActions } from "./loginMachine";
import { useMemo } from "react";

export function useLogin(customActions: LoginMachineActions = {}) {
  // 使用useMemo缓存状态机实例
  const loginMachine = useMemo(() => createLoginMachine(customActions), []);

  const [state, send] = useMachine(loginMachine, {
    // 只在开发环境下使用 inspector
    ...(process.env.NODE_ENV === "development" && window.inspector
      ? { inspect: window.inspector.inspect }
      : {}),
  });

  const onEmailChange = (email: string) => {
    send({ type: "CHANGE_EMAIL", value: email });
  };

  const onPasswordChange = (password: string) => {
    send({ type: "CHANGE_PASSWORD", value: password });
  };

  const onSubmit = async () => {
    send({ type: "SUBMIT" });
  };

  const onReset = () => {
    send({ type: "RESET" });
  };

  const onCANCEL = () => {
    send({ type: "CANCEL" });
  };

  return {
    email: state.context.email,
    password: state.context.password,
    errorMessage: state.context.errorMessage,
    isIdle: state.matches("idle"),
    isSubmitting: state.matches("submitting"),
    isSuccess: state.matches("success"),

    onEmailChange,
    onPasswordChange,
    onSubmit,
    onReset,
    onCANCEL,
  };
}
