/**
 * @fileoverview Tab de Créditos para el perfil de usuario
 * @module components/profile/tabs/CreditsTab
 */

import CreditManager from '../../CreditManager';

/**
 * CreditsTab - Pestaña de gestión de créditos
 *
 * @param {object} user - Usuario cuyo créditos se gestionan
 * @param {object} currentUser - Usuario actual (quien está viendo)
 * @param {function} onUpdate - Callback cuando se actualizan los créditos
 */
function CreditsTab({ user, currentUser, onUpdate }) {
  return (
    <div className="p-4 md:p-6">
      <CreditManager
        userId={user?.uid || user?.id}
        currentUser={currentUser}
        onUpdate={onUpdate}
      />
    </div>
  );
}

export default CreditsTab;
