import MainLayout from "@/components/MainLayout";
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { redirect } from "next/navigation"
import { Role } from "@/types"

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {

    const session = await getServerSession(authOptions)
    if (!session || session.error === "RefreshAccessTokenError") {
        redirect("/auth/login");
    }

    const user =
        session?.user
            ? {
                id: session.user.id,
                name: session.user.name ?? "",
                email: session.user.email ?? "",
                role: (session.user.role ?? 'BUSINESS_ADMIN') as Role,
            }
            : null

    // const user = {
    //     id: "cf1b9b65-4c49-400c-b7c1-093cda9173b2",
    //     email: "john@hgreg.com",
    //     name: "John Hairabedian",
    //     role: "SUPER_ADMIN"
    // }; 
    return (
        <MainLayout user={user}>
            {children}
        </MainLayout>
    )
}