const SectionTitle = ({ children }) => {
    return <h1 className="text-2xl font-semibold">{children}</h1>;
}

const SectionSubTitle = ({ children }) => {
    return <h2 className="text-gray-500 font-semibold">{children}</h2>;
}

export { SectionTitle, SectionSubTitle }