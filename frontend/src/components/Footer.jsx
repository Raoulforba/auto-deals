
function Footer() {
  return (
    <footer id="contact" className="bg-[#111111] text-white pt-14 pb-8">

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">

        <div>
          <h2 className="text-3xl font-black">
            AUTO <span className="text-[#D4AF37]">DEALS</span>
          </h2>

          <p className="text-gray-400 mt-4 leading-relaxed">
            Votre partenaire automobile au Cameroun.
            Découvrez notre sélection de véhicules d'occasion.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4">Navigation</h3>

          <ul className="space-y-3 text-gray-400">
            <li><a href="/" className="hover:text-[#D4AF37]">Accueil</a></li>
            <li><a href="#vehicules" className="hover:text-[#D4AF37]">Nos véhicules</a></li>
            <li><a href="#apropos" className="hover:text-[#D4AF37]">À propos</a></li>
            <li><a href="#contact" className="hover:text-[#D4AF37]">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4">Contactez-nous</h3>

          <p className="text-gray-400">
            Cameroun
          </p>

          <a
            href="https://wa.me/237691178349"
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-4 bg-[#D4AF37] text-black px-5 py-3 rounded-lg font-bold"
          >
            Écrire sur WhatsApp
          </a>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-white/10 mt-12 pt-6 text-center text-gray-500 text-sm">
        © 2026 AUTO DEALS. Tous droits réservés.
      </div>

    </footer>
  )
}

export default Footer
