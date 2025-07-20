import { LoginLayout } from "@/layouts/login-layout";
import { LoginForm } from "@/pages/login/login-form";
import { BasicInfoForm } from "@/pages/sign-up/basicInfo-form";
import { SignUpForm } from "@/pages/sign-up/signup-form";

const LoginPage = () => {
    return (
        <LoginLayout>
            <LoginForm></LoginForm>
        </LoginLayout>
    );
}

const SignUpPage = () => {
    return (
        <LoginLayout>
            <SignUpForm></SignUpForm>
        </LoginLayout>
    );
}

const BasicInfoPage = () => {
    return (
        <LoginLayout>
            <BasicInfoForm></BasicInfoForm>
        </LoginLayout>
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