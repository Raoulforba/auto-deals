
function Hero() {
  return (
    <section className="relative min-h-[600px] flex items-center bg-[#111111] text-white overflow-hidden">

      {/* Image de fond */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1800')"
        }}
      />

      {/* Filtre sombre */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

      {/* Contenu */}
      <div className="relative max-w-7xl mx-auto px-6 py-24 w-full">

        <span className="text-[#D4AF37] uppercase tracking-[4px] text-sm font-bold">
          AUTO DEALS — CAMEROUN
        </span>

        <h1 className="text-4xl md:text-6xl font-black mt-6 max-w-3xl leading-tight">
          Trouvez la voiture
          <span className="text-[#D4AF37]"> de vos rêves.</span>
        </h1>

        <p className="text-gray-300 mt-6 max-w-xl text-lg leading-relaxed">
          Découvrez notre sélection de véhicules d'occasion
          soigneusement sélectionnés pour vous.
        </p>

        <a
          href="#vehicules"
          className="inline-block mt-9 bg-[#D4AF37] text-black px-8 py-4 rounded-lg font-bold hover:bg-yellow-500 transition"
        >
          Découvrir nos véhicules
        </a>

      </div>
    </section>
  )
}

export default Hero
