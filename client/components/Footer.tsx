import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left: Brand and Copyright */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center text-sm">
                ⚙️
              </div>
              <span className="font-semibold">ComplianCe</span>
            </div>
            <span className="text-sm text-gray-400">
              &copy; {currentYear} All rights reserved.
            </span>
          </div>

          {/* Center: Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
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
          <div className="flex gap-3">
            <a
              href="#"
              className="text-gray-400 hover:text-primary transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-primary transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-primary transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-primary transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
