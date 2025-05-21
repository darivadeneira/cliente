import './App.css'
import { Home } from './components/Home'
// Importar estilos de PrimeReact
import 'primereact/resources/themes/lara-light-indigo/theme.css'  // tema
import 'primereact/resources/primereact.min.css'                  // core
import 'primeflex/primeflex.css'                                  // flexbox

function App() {
  return (
    <div className="app-container">
      <Home />
    </div>
  )
}

export default App
