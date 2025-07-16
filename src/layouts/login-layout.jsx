// Layout for the initial login and signup forms
const LoginLayout = ({ children }) => {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <h1 className='text-center text-4xl mb-5 text-primary font-semibold'>PrimeDFit</h1>
                {children}
            </div>
        </div>
    );
}

export { LoginLayout }