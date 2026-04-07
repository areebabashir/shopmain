import Header from "./Header";
import Footer from "./Footer";
import MobileNav from "./MobileNav";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1 pb-16 md:pb-0">{children}</main>
    <Footer />
    <MobileNav />
  </div>
);

export default Layout;
