import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-card border-t border-border py-6 px-4 md:px-8 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium">
        {/* Left: Copyright */}
        <div className="text-text-sub text-center md:text-left">
          <p>
            &copy; {currentYear}{" "}
            <span className="text-primary font-bold">Baba Car Wash</span>. All
            rights reserved.
          </p>
        </div>

        {/* Right: Version & Credits */}
        <div className="flex items-center gap-6 text-text-muted">
          <a href="#" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Terms of Service
          </a>

          <div className="hidden sm:flex items-center gap-1 pl-6 border-l border-border">
            <span>v1.0.0</span>
            <span className="mx-1">•</span>
            <span className="flex items-center">
              Made with{" "}
              <Heart className="w-3 h-3 text-danger mx-1 fill-danger" /> by
              Admin
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
