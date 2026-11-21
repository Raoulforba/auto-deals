
function Navbar() {
  return (
    <header className="bg-[#111111] text-white border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

        <a href="/" className="text-2xl font-black tracking-wider">
          AUTO <span className="text-[#D4AF37]">DEALS</span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="/" className="hover:text-[#D4AF37] transition">Accueil</a>
          <a href="#vehicules" className="hover:text-[#D4AF37] transition">Nos véhicules</a>
          <a href="#apropos" className="hover:text-[#D4AF37] transition">À propos</a>
          <a href="#contact" className="hover:text-[#D4AF37] transition">Contact</a>
        </div>

        <a
          href="https://wa.me/237657902986"
          target="_blank"
          rel="noreferrer"
          className="bg-[#D4AF37] text-black px-5 py-3 rounded-lg font-bold text-sm hover:bg-yellow-500 transition"
        >
          WhatsApp
        </a>

      </nav>
    </header>
  )
}

export default Navbar
