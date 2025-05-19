import React from "react";
import * as Form from "@radix-ui/react-form";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Separator from "@radix-ui/react-separator";
import * as Flex from "@radix-ui/react-flex";
import * as Box from "@radix-ui/react-box";
import * as Text from "@radix-ui/react-text";
import * as Heading from "@radix-ui/react-heading";
import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import * as Label from "@radix-ui/react-label";
import { CheckIcon } from "@radix-ui/react-icons";
import "./LoginPage.less";

const LoginPage = () => {
  return (
    <Box.Root className="login-page">
      <Flex.Root className="login-container">
        <Box.Root className="login-card">
          <Flex.Root direction="column" gap="4">
            <Box.Root className="login-header">
              <Heading.Root className="login-title">欢迎登录</Heading.Root>
              <Text.Root className="login-subtitle">
                请输入您的账号信息
              </Text.Root>
            </Box.Root>

            <Form.Root className="login-form">
              <Flex.Root direction="column" gap="4">
                <Form.Field className="form-field" name="email">
                  <Flex.Root justify="between" align="baseline">
                    <Form.Label asChild>
                      <Label.Root className="field-label">邮箱</Label.Root>
                    </Form.Label>
                    <Form.Message className="field-error" match="valueMissing">
                      请输入邮箱地址
                    </Form.Message>
                    <Form.Message className="field-error" match="typeMismatch">
                      请输入有效的邮箱地址
                    </Form.Message>
                  </Flex.Root>
                  <Form.Control asChild>
                    <input
                      className="field-input"
                      type="email"
                      required
                      placeholder="请输入您的邮箱"
                    />
                  </Form.Control>
                </Form.Field>

                <Form.Field className="form-field" name="password">
                  <Flex.Root justify="between" align="baseline">
                    <Form.Label asChild>
                      <Label.Root className="field-label">密码</Label.Root>
                    </Form.Label>
                    <Form.Message className="field-error" match="valueMissing">
                      请输入密码
                    </Form.Message>
                  </Flex.Root>
                  <Form.Control asChild>
                    <input
                      className="field-input"
                      type="password"
                      required
                      placeholder="请输入您的密码"
                    />
                  </Form.Control>
                </Form.Field>

                <Flex.Root
                  className="form-options"
                  justify="between"
                  align="center"
                >
                  <Flex.Root align="center" gap="2" className="remember-me">
                    <Checkbox.Root className="checkbox-root" id="remember">
                      <Checkbox.Indicator className="checkbox-indicator">
                        <CheckIcon />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <Label.Root htmlFor="remember" className="checkbox-label">
                      记住我
                    </Label.Root>
                  </Flex.Root>
                  <Text.Root asChild>
                    <a href="#" className="forgot-password">
                      忘记密码?
                    </a>
                  </Text.Root>
                </Flex.Root>

                <Form.Submit asChild>
                  <button className="submit-button" type="submit">
                    登录
                  </button>
                </Form.Submit>

                <Separator.Root className="separator" />

                <Flex.Root
                  justify="center"
                  align="center"
                  gap="1"
                  className="signup-option"
                >
                  <Text.Root>还没有账号?</Text.Root>
                  <Text.Root asChild>
                    <a href="#" className="signup-link">
                      立即注册
                    </a>
                  </Text.Root>
                </Flex.Root>
              </Flex.Root>
            </Form.Root>
          </Flex.Root>
        </Box.Root>
      </Flex.Root>
    </Box.Root>
  );
};

export default LoginPage;
