const SectionTitle = ({ children }) => {
    return <h1 className="text-3xl font-semibold">{children}</h1>;
}

const SectionSubTitle = ({ children }) => {
    return <h2 className="text-xl text-gray-500 font-semibold">{children}</h2>;
}

const SectionSubText = ({ children }) => {
    return <p className="-mt-4 text-gray-500">{children}</p>;
}

export { SectionTitle, SectionSubTitle, SectionSubText }