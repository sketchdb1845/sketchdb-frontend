import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 overflow-y-auto lg:overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="absolute inset-0 bg-blue-300 opacity-10 dark:opacity-20"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 xl:gap-16 items-center">
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-2xl xs:text-2xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
              Visualize Your Database in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                Seconds
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 px-2 sm:px-0">
              DB diagram editor for Team Collaboration & Schema Migration.
              Create, edit, and share database schemas with your team
              effortlessly.
            </p>

            <div className="mt-5 flex flex-row xs:flex-row gap-3 sm:gap-4 justify-center lg:justify-start xs:px-0">
              <button className="cursor-pointer w-full xs:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base">
                Start For Free
              </button>

              <button
                onClick={() => {
                  navigate("/playground");
                }}
                className="w-full xs:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm sm:text-base"
              >
                View Demo
              </button>
            </div>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4 xs:px-0">
              ✓ No credit card required
            </p>
          </div>

          <div className="relative order-1 lg:order-2 mb-8 lg:mb-0 px-4 sm:px-6 lg:px-0">
            <div className="relative rounded-xl shadow-2xl overflow-hidden bg-white dark:bg-gray-800 p-1 sm:p-2 max-w-lg mx-auto lg:max-w-none">
              <img
                src="https://images.chartdb.io/docs/hero-dark.png"
                alt="SketchDB Database Diagram Editor Interface"
                className="w-full h-auto rounded-lg"
              />
            </div>

            {/* Floating elements */}
            {/* <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-20 animate-pulse"></div> */}
            {/* <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-15 animate-pulse delay-1000"></div> */}
          </div>
        </div>

        <div className="mt-12 sm:mt-16 md:mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-4 sm:px-0">
          <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Lightning Fast
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Create database diagrams in seconds with our intuitive
              drag-and-drop interface.
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 sm:col-span-2 md:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Team Collaboration
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Work together with your team in real-time to design and refine
              database schemas.
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 sm:col-start-2 sm:col-end-2 md:col-start-auto md:col-end-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Easy Export
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Export your diagrams as SQL, PNG, or PDF for documentation and
              implementation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
