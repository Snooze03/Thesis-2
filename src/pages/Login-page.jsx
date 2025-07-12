import { LoginLayout } from "../layouts/login-layout"
import { LoginForm } from "../components/login-form"

const LoginPage = () => {
    return (
        <>
            <LoginLayout>
                <LoginForm></LoginForm>
            </LoginLayout>
        </>
    );
}

export default LoginPage