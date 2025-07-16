import { LoginLayout } from "../layouts/login-layout"
import { LoginForm } from "../components/login-form"
import { BasicInfoForm } from "../components/basicInfo-form"
import { SignUpForm } from "../components/signup-form"

const LoginPage = () => {
    return (
        <>
            <LoginLayout>
                <LoginForm></LoginForm>
            </LoginLayout>
        </>
    );
}

const SignUpPage = () => {
    return (
        <>
            <LoginLayout>
                <SignUpForm></SignUpForm>
            </LoginLayout>
        </>
    );
}

const BasicInfoPage = () => {
    return (
        <>
            <LoginLayout>
                <BasicInfoForm></BasicInfoForm>
            </LoginLayout>
        </>
    );
}
const AdditionalInfoPage = () => {
    return (
        <>
            <p>Additional Information</p>
        </>
    );
}

export {
    LoginPage,
    SignUpPage,
    BasicInfoPage,
    AdditionalInfoPage
} 