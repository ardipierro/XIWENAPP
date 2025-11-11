/**
 * RoleSelector - 100% Tailwind CSS (sin archivo CSS)
 * Selector de rol (Profesor/Alumno) con diseño mobile-first
 */

function RoleSelector({ onSelectRole }) {
  return (
    <div className="min-h-screen
                    bg-gradient-to-br from-[#667eea] to-[#764ba2]
                    flex justify-center items-center
                    p-5">
      <div className="max-w-[800px] w-full">
        {/* Header */}
        <div className="text-center text-white mb-12 md:mb-15
                       animate-[fadeInDown_0.6s_ease-out]">
          <h1 className="text-4xl md:text-5xl
                        m-0 mb-4
                        font-extrabold
                        [text-shadow:0_4px_12px_rgba(0,0,0,0.2)]">
            🎮 Quiz Game Xiwen
          </h1>
          <p className="text-base md:text-xl
                       m-0
                       opacity-95">
            Selecciona tu tipo de acceso
          </p>
        </div>

        {/* Role Cards Grid - Mobile first: 1 col, Desktop: 2 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2
                       gap-5 md:gap-7
                       mb-10">

          {/* Teacher Card */}
          <button
            className="relative overflow-hidden
                       bg-gradient-to-br from-[#667eea] to-[#764ba2]
                       rounded-3xl
                       py-9 px-6 md:py-12 md:px-8
                       text-center text-white
                       border-none cursor-pointer
                       shadow-[0_10px_40px_rgba(0,0,0,0.15)]
                       transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
                       animate-[fadeInUp_0.6s_ease-out]
                       hover:-translate-y-3 hover:scale-[1.02]
                       hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]
                       group
                       before:content-[''] before:absolute before:inset-0
                       before:bg-gradient-to-br before:from-transparent before:to-white/10
                       before:opacity-0 before:transition-opacity before:duration-400
                       hover:before:opacity-100"
            onClick={() => onSelectRole('teacher')}
          >
            <div className="text-[64px] md:text-[80px]
                           mb-6
                           animate-[bounce_2s_infinite]
                           group-hover:animate-[bounce_0.6s_infinite]">
              👨‍🏫
            </div>
            <h2 className="text-3xl md:text-[32px]
                          m-0 mb-4
                          font-bold">
              Profesor
            </h2>
            <p className="text-sm md:text-base
                         m-0 mb-6
                         opacity-95
                         leading-relaxed">
              Gestionar alumnos, crear juegos y ver estadísticas
            </p>
            <div className="text-[28px] font-bold
                           opacity-0 -translate-x-2.5
                           transition-all duration-400
                           group-hover:opacity-100 group-hover:translate-x-0">
              →
            </div>
          </button>

          {/* Student Card */}
          <button
            className="relative overflow-hidden
                       bg-gradient-to-br from-[#f093fb] to-[#f5576c]
                       rounded-3xl
                       py-9 px-6 md:py-12 md:px-8
                       text-center text-white
                       border-none cursor-pointer
                       shadow-[0_10px_40px_rgba(0,0,0,0.15)]
                       transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
                       animate-[fadeInUp_0.6s_ease-out]
                       hover:-translate-y-3 hover:scale-[1.02]
                       hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]
                       group
                       before:content-[''] before:absolute before:inset-0
                       before:bg-gradient-to-br before:from-transparent before:to-white/10
                       before:opacity-0 before:transition-opacity before:duration-400
                       hover:before:opacity-100"
            onClick={() => onSelectRole('student')}
          >
            <div className="text-[64px] md:text-[80px]
                           mb-6
                           animate-[bounce_2s_infinite]
                           group-hover:animate-[bounce_0.6s_infinite]">
              👨‍🎓
            </div>
            <h2 className="text-3xl md:text-[32px]
                          m-0 mb-4
                          font-bold">
              Alumno
            </h2>
            <p className="text-sm md:text-base
                         m-0 mb-6
                         opacity-95
                         leading-relaxed">
              Jugar, ganar puntos y ver tu progreso
            </p>
            <div className="text-[28px] font-bold
                           opacity-0 -translate-x-2.5
                           transition-all duration-400
                           group-hover:opacity-100 group-hover:translate-x-0">
              →
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-white
                       text-base
                       opacity-90
                       animate-[fadeIn_0.6s_ease-out_0.3s_both]">
          <p>✨ Aprende jugando con Xiwen</p>
        </div>
      </div>
    </div>
  );
}

export default RoleSelector;
