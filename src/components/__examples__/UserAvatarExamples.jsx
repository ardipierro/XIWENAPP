/**
 * @fileoverview Ejemplos de uso del componente UserAvatar
 * @module components/__examples__/UserAvatarExamples
 *
 * Este archivo contiene ejemplos de todas las funcionalidades del UserAvatar
 */

import UserAvatar from '../UserAvatar';

/**
 * Ejemplo completo de todos los casos de uso de UserAvatar
 */
function UserAvatarExamples() {
  return (
    <div className="p-8 space-y-12 bg-white dark:bg-zinc-900">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
        Ejemplos de UserAvatar
      </h1>

      {/* ================================== */}
      {/* TAMAÑOS */}
      {/* ================================== */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          1. Tamaños Disponibles
        </h2>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="text-center">
            <UserAvatar
              name="XS Size"
              email="xs@test.com"
              size="xs"
            />
            <p className="text-xs mt-2 text-zinc-600 dark:text-zinc-400">xs (24px)</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="Small Size"
              email="sm@test.com"
              size="sm"
            />
            <p className="text-xs mt-2 text-zinc-600 dark:text-zinc-400">sm (32px)</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="Medium Size"
              email="md@test.com"
              size="md"
            />
            <p className="text-xs mt-2 text-zinc-600 dark:text-zinc-400">md (48px) - default</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="Large Size"
              email="lg@test.com"
              size="lg"
            />
            <p className="text-xs mt-2 text-zinc-600 dark:text-zinc-400">lg (64px)</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="XL Size"
              email="xl@test.com"
              size="xl"
            />
            <p className="text-xs mt-2 text-zinc-600 dark:text-zinc-400">xl (96px)</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="2XL Size"
              email="2xl@test.com"
              size="2xl"
            />
            <p className="text-xs mt-2 text-zinc-600 dark:text-zinc-400">2xl (128px)</p>
          </div>
        </div>
      </section>

      {/* ================================== */}
      {/* BADGES DE ESTADO */}
      {/* ================================== */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          2. Badges de Estado (Online/Offline/Busy/Away)
        </h2>
        <div className="flex items-center gap-8 flex-wrap">
          <div className="text-center">
            <UserAvatar
              name="Online User"
              email="online@test.com"
              size="lg"
              status="online"
              showStatusBadge={true}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">Online</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="Offline User"
              email="offline@test.com"
              size="lg"
              status="offline"
              showStatusBadge={true}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">Offline</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="Busy User"
              email="busy@test.com"
              size="lg"
              status="busy"
              showStatusBadge={true}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">Busy</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="Away User"
              email="away@test.com"
              size="lg"
              status="away"
              showStatusBadge={true}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">Away</p>
          </div>
        </div>
      </section>

      {/* ================================== */}
      {/* BADGES DE NOTIFICACIONES */}
      {/* ================================== */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          3. Badges de Notificaciones
        </h2>
        <div className="flex items-center gap-8 flex-wrap">
          <div className="text-center">
            <UserAvatar
              name="User With Notifications"
              email="notif@test.com"
              size="lg"
              notificationCount={3}
              showNotificationBadge={true}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">3 notificaciones</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="User With Many Notifications"
              email="many@test.com"
              size="lg"
              notificationCount={42}
              showNotificationBadge={true}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">42 notificaciones</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="User With 100+ Notifications"
              email="overflow@test.com"
              size="lg"
              notificationCount={150}
              showNotificationBadge={true}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">150 (muestra 99+)</p>
          </div>
        </div>
      </section>

      {/* ================================== */}
      {/* COMBINACIÓN DE BADGES */}
      {/* ================================== */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          4. Combinación de Badges (Estado + Notificaciones)
        </h2>
        <div className="flex items-center gap-8 flex-wrap">
          <div className="text-center">
            <UserAvatar
              name="Online with Notifications"
              email="combo1@test.com"
              size="xl"
              status="online"
              showStatusBadge={true}
              notificationCount={5}
              showNotificationBadge={true}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">Online + 5 notif</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="Busy with Notifications"
              email="combo2@test.com"
              size="xl"
              status="busy"
              showStatusBadge={true}
              notificationCount={12}
              showNotificationBadge={true}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">Busy + 12 notif</p>
          </div>
        </div>
      </section>

      {/* ================================== */}
      {/* BANNER DE FONDO */}
      {/* ================================== */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          5. Banner de Fondo
        </h2>
        <div className="flex items-center gap-8 flex-wrap">
          <div className="text-center">
            <UserAvatar
              name="User with Default Banner"
              email="banner1@test.com"
              size="xl"
              showBanner={true}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">Banner por defecto</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="User with Custom Banner"
              email="banner2@test.com"
              size="xl"
              showBanner={true}
              bannerUrl="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300"
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">Banner personalizado</p>
          </div>
        </div>
      </section>

      {/* ================================== */}
      {/* INTERACTIVIDAD */}
      {/* ================================== */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          6. Interactividad (Clickable)
        </h2>
        <div className="flex items-center gap-8 flex-wrap">
          <div className="text-center">
            <UserAvatar
              name="Clickable Avatar"
              email="click@test.com"
              size="lg"
              clickable={true}
              onClick={() => alert('Avatar clicked!')}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">Haz click (con hover effect)</p>
          </div>

          <div className="text-center">
            <UserAvatar
              name="Non-clickable Avatar"
              email="noclick@test.com"
              size="lg"
              clickable={false}
            />
            <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">Sin click (sin hover effect)</p>
          </div>
        </div>
      </section>

      {/* ================================== */}
      {/* CASOS DE USO REAL */}
      {/* ================================== */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          7. Casos de Uso Reales
        </h2>

        {/* TopBar Example */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            TopBar (Navbar)
          </h3>
          <div className="flex items-center gap-2 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <UserAvatar
              userId="current-user-id"
              name="Juan Pérez"
              email="juan@xiwen.com"
              size="sm"
              status="online"
              showStatusBadge={true}
            />
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              Juan Pérez
            </span>
          </div>
        </div>

        {/* Chat/Messages List */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            Lista de Mensajes
          </h3>
          <div className="space-y-2">
            {[
              { name: 'María García', unread: 3, status: 'online' },
              { name: 'Pedro Sánchez', unread: 0, status: 'away' },
              { name: 'Ana López', unread: 12, status: 'busy' }
            ].map((user, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <UserAvatar
                  name={user.name}
                  email={`${user.name.toLowerCase().replace(' ', '.')}@test.com`}
                  size="md"
                  status={user.status}
                  showStatusBadge={true}
                  notificationCount={user.unread}
                  showNotificationBadge={true}
                />
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {user.unread > 0 ? `${user.unread} mensajes sin leer` : 'Sin mensajes nuevos'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Card */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            Tarjeta de Estudiante
          </h3>
          <div className="flex items-start gap-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <UserAvatar
              name="Laura Martínez"
              email="laura@student.xiwen.com"
              size="lg"
              status="online"
              showStatusBadge={true}
            />
            <div className="flex-1">
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
                Laura Martínez
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Nivel 12 • 4,580 XP • Racha: 7 días 🔥
              </p>
              <div className="mt-2 flex gap-2">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
                  Activo
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================== */}
      {/* CÓDIGO DE EJEMPLO */}
      {/* ================================== */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          8. Código de Ejemplo
        </h2>
        <div className="bg-zinc-900 text-zinc-100 p-6 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`// Avatar básico con iniciales
<UserAvatar
  name="Juan Pérez"
  email="juan@test.com"
  size="md"
/>

// Avatar con estado online
<UserAvatar
  userId="user123"
  name="María García"
  size="lg"
  status="online"
  showStatusBadge={true}
/>

// Avatar con notificaciones
<UserAvatar
  name="Pedro Sánchez"
  email="pedro@test.com"
  notificationCount={5}
  showNotificationBadge={true}
/>

// Avatar con banner de fondo
<UserAvatar
  name="Ana López"
  size="xl"
  showBanner={true}
  bannerId="user456"
/>

// Avatar clickable con todos los badges
<UserAvatar
  userId="user789"
  name="Carlos Ruiz"
  size="lg"
  status="busy"
  showStatusBadge={true}
  notificationCount={12}
  showNotificationBadge={true}
  clickable={true}
  onClick={() => console.log('Avatar clicked!')}
/>`}
          </pre>
        </div>
      </section>

      {/* ================================== */}
      {/* PROPS REFERENCE */}
      {/* ================================== */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          9. Props Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-zinc-200 dark:border-zinc-700">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <th className="px-4 py-2 text-left border-b border-zinc-200 dark:border-zinc-700">Prop</th>
                <th className="px-4 py-2 text-left border-b border-zinc-200 dark:border-zinc-700">Tipo</th>
                <th className="px-4 py-2 text-left border-b border-zinc-200 dark:border-zinc-700">Default</th>
                <th className="px-4 py-2 text-left border-b border-zinc-200 dark:border-zinc-700">Descripción</th>
              </tr>
            </thead>
            <tbody className="text-zinc-900 dark:text-zinc-100">
              <tr>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 font-mono">userId</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">string</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">-</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">ID del usuario para cargar desde Firebase</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 font-mono">name</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">string</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">-</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">Nombre del usuario (para iniciales)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 font-mono">size</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">xs|sm|md|lg|xl|2xl</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">md</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">Tamaño del avatar</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 font-mono">status</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">online|offline|busy|away</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">null</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">Estado del usuario</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 font-mono">showStatusBadge</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">boolean</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">false</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">Mostrar badge de estado</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 font-mono">notificationCount</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">number</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">0</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">Número de notificaciones</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 font-mono">showNotificationBadge</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">boolean</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">false</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">Mostrar badge de notificaciones</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 font-mono">showBanner</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">boolean</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">false</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">Mostrar banner de fondo</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 font-mono">clickable</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">boolean</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">false</td>
                <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">Aplicar efectos hover</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono">onClick</td>
                <td className="px-4 py-2">function</td>
                <td className="px-4 py-2">-</td>
                <td className="px-4 py-2">Callback al hacer click</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default UserAvatarExamples;
