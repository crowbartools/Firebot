type Props = {
    children: React.ReactNode,
}

export const PageWrapper: React.FC<Props> = ({ children }) => {
    return (
      <div className="w-full h-full overflow-y-scroll">
        {children}
      </div>
    );
};