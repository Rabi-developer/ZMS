import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    className: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children, className }) => {
    const currentPath = usePathname();

    const isActive = currentPath === href;

    return (
        <Link href={href} className={`${className} ${isActive ? 'bg-[#465869] text-white border-[#33a4d8] border-s-4' : 'text-black'}`}>
            {children}
        </Link>
    );
};

export default NavLink;
