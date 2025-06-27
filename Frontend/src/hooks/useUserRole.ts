import { useSession } from "next-auth/react";

const useUserRole = () => {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  return session?.user?.role || null;
};

export default useUserRole;
