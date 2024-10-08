import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

type Props = {
    title: string
}

export const PageTitle: React.FC<Props> = (({ title }) => {
    return <div className={`text-2xl font-extrabold ${inter.className}`}>{title}</div>;
});