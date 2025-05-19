import type { LoginMachineActions } from "../../logics/login/loginMachine";
import { mockLoginFn } from "../../logics/login/mockLoginFn";
import { useLogin } from "../../logics/login/useLogin";
import { Form } from "radix-ui";
import { Box, Flex, Heading, Link } from "@radix-ui/themes";
import styles from "./index.module.css";
export default function Login() {
  const loginHookProps: LoginMachineActions = {
    loginFn: mockLoginFn,
    onLoginError: () => {
      console.log("登陆失败");
    },
    onLoginSuccess: () => {
      console.log("登陆成功");
    },
  };
  const {
    email,
    password,
    errorMessage,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    onReset,
    onCANCEL,
    isSubmitting,
    isSuccess,
  } = useLogin(loginHookProps);

  if (isSuccess) {
    return <div>登陆成功</div>;
  }

  return (
    <Box className="login-container">
      <Header />
      <Main />
      <Footer />
    </Box>
  );
}

const Header = () => {
  return <Heading as="h1">Hi! My Friend~</Heading>;
};

const Footer = () => {
  return (
    <Box>
      <Flex direction={"row"}>
        <Link href="#">忘记密码</Link>
        <Link href="#">注册账号</Link>
      </Flex>
    </Box>
  );
};

const Main = () => {
  return (
    <Box>
      <Form.Root>
        <Form.Field name="email">
          <Form.Label className={styles.FormLabel}>邮箱</Form.Label>
          <Form.Control asChild>
            <input type="email" required />
          </Form.Control>
          <Form.Message match="valueMissing">
            Please provide a name
          </Form.Message>
          {/* <Form.ValidityState /> */}
        </Form.Field>
        <Form.Field name="password">
          <Form.Label className={styles.FormLabel}>密码</Form.Label>
          <Form.Control asChild>
            <input type="password" minLength={6} required />
          </Form.Control>
          <Form.Message match="valueMissing">
            Please provide a password
          </Form.Message>
          <Form.Message match="tooShort">min length is 6</Form.Message>
          {/* <Form.ValidityState /> */}
        </Form.Field>
        <Form.Submit>登陆</Form.Submit>
      </Form.Root>
    </Box>
  );
};
