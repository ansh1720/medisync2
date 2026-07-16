import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand & Disclaimer */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                Medi<span className="text-blue-500">Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-wider font-semibold">
              Medical Disclaimer
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              MediSync is an informational and consultation scheduling platform. The content, assessments, and diagnostics provided on this website do not constitute direct medical advice, diagnosis, or treatment plans. Always consult a licensed medical professional for health concerns or emergencies.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 md:pl-8">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">
              Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/consultation/history" className="hover:text-blue-400 transition-colors">
                  Video Consultations
                </Link>
              </li>
              <li>
                <Link to="/diseases" className="hover:text-blue-400 transition-colors">
                  Disease Search
                </Link>
              </li>
              <li>
                <Link to="/risk" className="hover:text-blue-400 transition-colors">
                  Health Risk Assessment
                </Link>
              </li>
              <li>
                <Link to="/hospitals" className="hover:text-blue-400 transition-colors">
                  Hospital Locator
                </Link>
              </li>
              <li>
                <Link to="/forum" className="hover:text-blue-400 transition-colors">
                  Community Forum
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">
              Support & Contact
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center space-x-2">
                <span className="text-blue-500">📧</span>
                <span>support@medisync.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-blue-500">📞</span>
                <span>+91 9667758456</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5"></span>
                <span className="leading-relaxed">
                  100 Health Sciences Plaza,<br />
                  Suite 400, Vapi, Gujarat, India
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MediSync. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
