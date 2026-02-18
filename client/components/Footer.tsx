import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-white py-8 md:py-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
          {/* Left: Brand and Copyright */}
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm">
                ⚙️
              </div>
              <span className="font-semibold text-base">ComplianCe</span>
            </div>
            <span className="text-sm text-white/70">
              &copy; {currentYear} All rights reserved.
            </span>
          </div>

          {/* Center: Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-white/70">
            <Link to="/about" className="hover:text-primary transition-colors">
              About
            </Link>
            <Link
              to="/contact"
              className="hover:text-primary transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
          </div>

          {/* Right: Social Icons */}
          <div className="flex gap-4">
            <a
              href="#"
              className="text-white/70 hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-white/70 hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-white/70 hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-white/70 hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
