import DeploymentSidebar from './DeploymentSidebar.jsx';
import CommandPanel from './CommandPanel.jsx';

// technical.md 2.2 : tout ce qui n'est pas le champ de bataille lui-même. Affiche un simple
// message tant que la Scene Phaser n'a pas encore de bataille (faction pas encore choisie) —
// DeploymentSidebar/CommandPanel gèrent déjà ce cas en ne rendant rien.
export default function Sidebar() {
  return (
    <div className="h-screen overflow-y-auto bg-neutral-900 text-white divide-y divide-neutral-700">
      <DeploymentSidebar />
      <CommandPanel />
    </div>
  );
}
