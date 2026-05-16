import { Logo } from "./Logo";

interface FooterLink {
  label: string;
  href: string;
}

const SECTIONS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Proizvod",
    links: [
      { label: "Članci", href: "#" },
      { label: "Kategorije", href: "#" },
    ],
  },
  {
    title: "Tvrtka",
    links: [
      { label: "O nama", href: "#" },
      { label: "Kontakt", href: "#" },
    ],
  },
  {
    title: "Pravno",
    links: [
      { label: "Privatnost", href: "#" },
      { label: "Uvjeti korištenja", href: "#" },
    ],
  },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Logo size={28} />
            <span className="font-bold text-slate-800">Peristil</span>
          </div>
          <p className="text-slate-500 text-xs">
            Prijavljivanje gradskih problema uz podršku zajednice.
          </p>
        </div>
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="font-semibold text-slate-800 mb-2">{section.title}</p>
            <ul className="space-y-1 text-slate-600">
              {section.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-slate-900">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {year} Peristil. Sva prava pridržana.
      </div>
    </footer>
  );
}
