import { useState, useEffect } from 'react';
import {
  Calendar, CreditCard, CheckCircle, AlertTriangle, Users, BookOpen,
  Clock, Video, Info, CircleDot, AlarmClock
} from 'lucide-react';
import { getInstancesForStudent } from '../firebase/classInstances';
import { getStudentAttendance, markAttendanceByLink } from '../firebase/attendance';
import { getStudentGroups } from '../firebase/groups';
import { getUserCredits } from '../firebase/credits';
import './StudentClassView.css';

// Helper: verificar si el link de una instancia está activo
function isInstanceLinkActive(instance) {
  const instanceDate = instance.date.toDate ? instance.date.toDate() : new Date(instance.date);
  const [hours, minutes] = instance.startTime.split(':').map(Number);
  instanceDate.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const activationTime = new Date(instanceDate.getTime() - 15 * 60000); // 15 min antes
  const expirationTime = new Date(instanceDate.getTime() + 15 * 60000); // 15 min después

  return now >= activationTime && now <= expirationTime;
}

/**
 * Vista de clases para estudiantes
 * Muestra instancias próximas con links activos
 */
function StudentClassView({ student }) {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [processingInstance, setProcessingInstance] = useState(null);
  const [studentGroups, setStudentGroups] = useState([]);

  useEffect(() => {
    if (student) {
      loadData();
      // Refresh cada 30 segundos para actualizar estado de links
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [student]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar créditos del estudiante
      const creditsData = await getUserCredits(student.id);
      setCredits(creditsData);

      // Obtener grupos del estudiante
      const groups = await getStudentGroups(student.id);
      setStudentGroups(groups);
      console.log('📚 Grupos del estudiante:', {
        studentId: student.id,
        studentName: student.name,
        groupCount: groups.length,
        groups: groups.map(g => ({ id: g.id, name: g.name }))
      });

      // Obtener instancias del estudiante
      const studentInstances = await getInstancesForStudent(student.id, 50);

      console.log('📊 Total de instancias:', studentInstances.length);

      // Filtrar solo futuras y ordenar por fecha
      const now = new Date();
      const futureInstances = studentInstances.filter(instance => {
        const instanceDate = instance.date.toDate ? instance.date.toDate() : new Date(instance.date);
        return instanceDate >= now;
      });

      futureInstances.sort((a, b) => {
        const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      });

      setInstances(futureInstances);

      // Verificar asistencia para cada instancia
      const attendanceStatusMap = {};
      for (const instance of futureInstances) {
        const attendance = await getStudentAttendance(instance.id, student.id);
        attendanceStatusMap[instance.id] = attendance;
      }
      setAttendanceStatus(attendanceStatusMap);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showMessage('error', 'Error al cargar clases');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleJoinClass = async (instance) => {
    if (processingInstance) return;

    setProcessingInstance(instance.id);

    try {
      // Verificar créditos
      if (!credits || credits.availableCredits < instance.creditCost) {
        showMessage('error', 'No tienes suficientes créditos para esta clase');
        setProcessingInstance(null);
        return;
      }

      // Marcar asistencia
      const result = await markAttendanceByLink(
        instance.id,
        student.id,
        student.name,
        instance.creditCost
      );

      if (result.success) {
        showMessage('success', 'Asistencia registrada. Crédito deducido.');

        // Abrir link de videollamada
        if (instance.meetingLink) {
          window.open(instance.meetingLink, '_blank');
        }

        // Recargar datos
        await loadData();
      } else if (result.insufficientCredits) {
        showMessage('error', 'No tienes suficientes créditos');
      } else {
        showMessage('error', result.error || 'Error al registrar asistencia');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Error inesperado');
    } finally {
      setProcessingInstance(null);
    }
  };

  const formatDate = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Mañana, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getInstanceStatus = (instance) => {
    const attendance = attendanceStatus[instance.id];

    if (attendance) {
      return {
        status: 'attended',
        label: 'Asistencia registrada',
        icon: <CheckCircle size={16} strokeWidth={2} className="inline-icon" />,
        canJoin: false
      };
    }

    const linkActive = isInstanceLinkActive(instance);

    if (linkActive) {
      return {
        status: 'active',
        label: 'Link activo - Únete ahora',
        icon: <CircleDot size={16} strokeWidth={2} className="inline-icon text-green-500" />,
        canJoin: true
      };
    }

    const instanceDate = instance.date.toDate ? instance.date.toDate() : new Date(instance.date);
    const [hours, minutes] = instance.startTime.split(':').map(Number);
    instanceDate.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const activationTime = new Date(instanceDate.getTime() - 15 * 60000);

    if (now < activationTime) {
      const diff = activationTime - now;
      const minutesLeft = Math.floor(diff / 60000);
      return {
        status: 'upcoming',
        label: `Link activo en ${minutesLeft} min`,
        icon: <Clock size={16} strokeWidth={2} className="inline-icon" />,
        canJoin: false
      };
    }

    return {
      status: 'expired',
      label: 'Ventana de acceso cerrada',
      icon: <AlarmClock size={16} strokeWidth={2} className="inline-icon" />,
      canJoin: false
    };
  };

  if (loading) {
    return (
      <div className="student-class-view loading">
        <div className="spinner"></div>
        <p>Cargando clases...</p>
      </div>
    );
  }

  return (
    <div className="student-class-view">
      {/* Header con créditos */}
      <div className="class-view-header">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <Calendar size={24} strokeWidth={2} /> Mis Clases
          </h2>
          <p className="section-subtitle">
            {instances.length} {instances.length === 1 ? 'clase próxima' : 'clases próximas'}
          </p>
        </div>
        <div className="credits-badge">
          <span className="credits-icon">
            <CreditCard size={24} strokeWidth={2} />
          </span>
          <div className="credits-info">
            <div className="credits-value">{credits?.availableCredits || 0}</div>
            <div className="credits-label">Créditos</div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`class-message ${message.type}`}>
          {message.type === 'success' ? (
            <CheckCircle size={18} strokeWidth={2} className="inline-icon" />
          ) : (
            <AlertTriangle size={18} strokeWidth={2} className="inline-icon" />
          )} {message.text}
        </div>
      )}

      {/* Instances List */}
      {instances.length === 0 ? (
        <div className="empty-classes">
          <div className="empty-icon">
            <BookOpen size={64} strokeWidth={2} className="text-gray-400" />
          </div>
          <h3 className="empty-title">No hay clases próximas</h3>
          <p className="empty-text">
            Tus próximas clases aparecerán aquí cuando sean programadas
          </p>
        </div>
      ) : (
        <div className="classes-list">
          {instances.map(instance => {
            const instanceStatus = getInstanceStatus(instance);
            const isProcessing = processingInstance === instance.id;

            return (
              <div key={instance.id} className={`class-card ${instanceStatus.status}`}>
                <div className="class-card-header">
                  <div className="class-info">
                    <h3 className="class-name">{instance.className}</h3>
                    <p className="class-group">{instance.groupIds?.[0] ? 'Grupo' : 'Individual'}</p>
                  </div>
                  <div className="class-cost">
                    <span className="cost-value">{instance.creditCost}</span>
                    <span className="cost-label">crédito{instance.creditCost !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="class-card-body">
                  <div className="class-datetime">
                    <span className="datetime-icon">
                      <Clock size={18} strokeWidth={2} />
                    </span>
                    <span className="datetime-text">{formatDate(instance.date)}</span>
                  </div>

                  <div className={`class-status status-${instanceStatus.status}`}>
                    {instanceStatus.icon} {instanceStatus.label}
                  </div>

                  {instanceStatus.canJoin && (
                    <button
                      className="btn-join-class"
                      onClick={() => handleJoinClass(instance)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <span className="spinner-small"></span>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Video size={18} strokeWidth={2} className="inline-icon" /> Unirse a la clase
                        </>
                      )}
                    </button>
                  )}

                  {instanceStatus.status === 'attended' && (
                    <div className="attendance-confirmed">
                      <CheckCircle size={16} strokeWidth={2} className="inline-icon" /> Asistencia confirmada
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="alert" style={{ background: 'var(--color-bg-info)', borderLeft: '4px solid var(--color-border-info)' }}>
        <h4 className="font-semibold flex items-center gap-2 mb-3">
          <Info size={18} strokeWidth={2} /> ¿Cómo funciona?
        </h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>El link de la clase se activa <strong>15 minutos antes</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>Al unirte, se deduce <strong>1 crédito</strong> automáticamente</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>Tienes hasta <strong>15 minutos después</strong> del inicio para unirte</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>Si no tienes créditos, no podrás unirte a la clase</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default StudentClassView;
