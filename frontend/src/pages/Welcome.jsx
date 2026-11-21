
import logo from "../assets/logo-auto-deals.png"

function Welcome({ onEnter }) {
  return (
    <main className="relative min-h-screen bg-[#101010] text-white overflow-hidden flex flex-col items-center justify-center px-6">

      {/* Décor géométrique */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[85%] h-[300px] border border-white/[0.07] rotate-[15deg]" />
        <div className="absolute w-[85%] h-[300px] border border-white/[0.07] -rotate-[15deg]" />
        <div className="absolute w-[70%] h-[250px] bg-white/[0.015] rotate-45" />
      </div>

      {/* Lumière dorée */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full" />

      {/* Logo */}
      <div className="relative z-10 mb-10">
        <img
          src={logo}
          alt="Logo AUTO DEALS"
          className="w-80 sm:w-[420px] md:w-[520px] h-auto object-contain mx-auto animate-logo"        />
      </div>

      {/* Présentation */}
      <div className="relative z-10 max-w-5xl text-center">

        <p className="text-[#D4AF37] tracking-[4px] text-xs md:text-sm mb-7">
          DES VÉHICULES D'EXCEPTION À VOTRE PORTÉE
        </p>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight">
          Votre prochaine voiture
          <span className="block text-[#D4AF37] mt-2">
            commence ici.
          </span>
        </h1>

        <p className="text-gray-400 text-sm md:text-lg leading-8 max-w-3xl mx-auto mt-8">
          Découvrez une nouvelle expérience automobile.
          Explorez notre sélection de véhicules d'occasion
          et trouvez celui qui correspond à vos envies.
        </p>

        <button
          onClick={onEnter}
          className="mt-12 bg-[#FFD700] text-black px-12 py-5 rounded-full font-bold text-xs tracking-[4px] hover:bg-white hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-500/10"
        >
          DÉCOUVRIR <span className="ml-2">↓</span>
        </button>

      </div>

      {/* Bas de page */}
      <div className="absolute bottom-8 text-gray-600 text-[10px] tracking-[3px]">
        © 2026 AUTO DEALS — CAMEROUN
      </div>

    </main>
  )
}

export default Welcome
