import { Link } from 'react-router-dom'

export default function PublicHome() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-2xl font-semibold">Bienvenue — veuillez vous connecter.</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
        Accédez à votre espace pour gérer vos clubs, sponsors et campagnes.
      </p>
      <Link
        to="/login"
        className="inline-block rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        Se connecter
      </Link>
    </div>
  )
}
