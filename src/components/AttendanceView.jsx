import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import {
  Calendar, BarChart3, CheckCircle, AlertTriangle, XCircle,
  Clock, FileText, Loader, User, Video
} from 'lucide-react';
import { getTeacherSessions, getClassSession } from '../firebase/classSessions';
import { getSessionAttendance, markBulkAttendance, updateAttendanceStatus } from '../firebase/attendance';
import { getUserProfile } from '../firebase/firestore';
import BaseButton from './common/BaseButton';
import UserAvatar from './UserAvatar';

/**
 * Vista de asistencia para profesores
 * Muestra sesiones próximas y asistencia en tiempo real
 */
function AttendanceView({ teacher }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (teacher) {
      loadSessions();
    }
  }, [teacher]);

  useEffect(() => {
    if (selectedSession) {
      loadSessionDetails();
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // Obtener sesiones del próximo mes
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const sessionsData = await getTeacherSessions(teacher.uid, startDate, endDate);

      // Ordenar por fecha (usar scheduledStart)
      sessionsData.sort((a, b) => {
        const dateA = a.scheduledStart?.toDate ? a.scheduledStart.toDate() : (a.scheduledStart ? new Date(a.scheduledStart) : new Date(0));
        const dateB = b.scheduledStart?.toDate ? b.scheduledStart.toDate() : (b.scheduledStart ? new Date(b.scheduledStart) : new Date(0));
        return dateA - dateB;
      });

      setSessions(sessionsData);

      // Seleccionar la primera sesión si existe
      if (sessionsData.length > 0 && !selectedSession) {
        setSelectedSession(sessionsData[0]);
      }
    } catch (error) {
      logger.error('Error al cargar sesiones:', error);
      showMessage('error', 'Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async () => {
    if (!selectedSession) return;

    try {
      // Cargar asistencia
      const attendanceData = await getSessionAttendance(selectedSession.id);
      setAttendance(attendanceData);

      // Cargar estudiantes asignados directamente de la sesión
      let members = [];
      if (selectedSession.assignedStudents && selectedSession.assignedStudents.length > 0) {
        // Cargar perfiles de estudiantes
        const studentPromises = selectedSession.assignedStudents.map(async (studentId) => {
          try {
            const profile = await getUserProfile(studentId);
            return {
              id: studentId,
              studentId: studentId,
              studentName: profile?.name || 'Estudiante',
              studentEmail: profile?.email || ''
            };
          } catch (err) {
            logger.warn('No se pudo cargar perfil de estudiante:', studentId);
            return {
              id: studentId,
              studentId: studentId,
              studentName: 'Estudiante',
              studentEmail: ''
            };
          }
        });
        members = await Promise.all(studentPromises);
      }
      setGroupMembers(members);
    } catch (error) {
      logger.error('Error al cargar detalles:', error);
      showMessage('error', 'Error al cargar detalles de la sesión');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleMarkAllPresent = async () => {
    if (!selectedSession) return;

    const unattendedMembers = groupMembers.filter(
      member => !attendance.some(att => att.studentId === member.studentId)
    );

    if (unattendedMembers.length === 0) {
      showMessage('error', 'Todos los estudiantes ya tienen asistencia registrada');
      return;
    }

    try {
      const students = unattendedMembers.map(m => ({
        id: m.studentId,
        name: m.studentName
      }));

      const result = await markBulkAttendance(
        selectedSession.id,
        students,
        'present',
        'teacher'
      );

      if (result.success) {
        showMessage('success', `${result.marked} asistencias marcadas`);
        await loadSessionDetails();
      } else {
        showMessage('error', 'Error al marcar asistencias');
      }
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error inesperado');
    }
  };

  const getAttendanceStatus = (member) => {
    const att = attendance.find(a => a.studentId === member.studentId);
    if (!att) return null;
    return att;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={16} strokeWidth={2} className="inline-icon" />;
      case 'absent':
        return <XCircle size={16} strokeWidth={2} className="inline-icon" />;
      case 'late':
        return <Clock size={16} strokeWidth={2} className="inline-icon" />;
      case 'excused':
        return <FileText size={16} strokeWidth={2} className="inline-icon" />;
      default:
        return <Loader size={16} strokeWidth={2} className="inline-icon" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present':
        return 'Presente';
      case 'absent':
        return 'Ausente';
      case 'late':
        return 'Tarde';
      case 'excused':
        return 'Justificado';
      default:
        return 'Pendiente';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return 'Fecha no disponible';
    }

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();

    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAttendanceStats = () => {
    if (!selectedSession || groupMembers.length === 0) {
      return { present: 0, absent: 0, pending: 0, percentage: 0 };
    }

    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const pending = groupMembers.length - attendance.length;
    const percentage = Math.round((present / groupMembers.length) * 100) || 0;

    return { present, absent, pending, percentage };
  };

  if (loading) {
    return (
      <div className="attendance-view loading">
        <div className="spinner"></div>
        <p>Cargando asistencia...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="attendance-view">
        <div className="empty-sessions">
          <div className="empty-icon">
            <Calendar size={64} strokeWidth={2} />
          </div>
          <h3 className="empty-title">No hay clases programadas</h3>
          <p className="empty-text">
            Crea horarios para tus grupos para ver las sesiones aquí
          </p>
        </div>
      </div>
    );
  }

  const stats = calculateAttendanceStats();

  return (
    <div className="attendance-view">
      {/* Header con estadísticas */}
      <div className="attendance-header">
        <h2 className="attendance-title flex items-center gap-2">
          <BarChart3 size={28} strokeWidth={2} /> Asistencia de Clases
        </h2>

        {selectedSession && (
          <div className="attendance-stats">
            <div className="stat-item stat-present">
              <div className="stat-value">{stats.present}</div>
              <div className="stat-label">Presentes</div>
            </div>
            <div className="stat-item stat-pending">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pendientes</div>
            </div>
            <div className="stat-item stat-percentage">
              <div className="stat-value">{stats.percentage}%</div>
              <div className="stat-label">Asistencia</div>
            </div>
          </div>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`attendance-message ${message.type}`}>
          {message.type === 'success' ? (
            <CheckCircle size={18} strokeWidth={2} className="inline-icon" />
          ) : (
            <AlertTriangle size={18} strokeWidth={2} className="inline-icon" />
          )} {message.text}
        </div>
      )}

      <div className="attendance-content">
        {/* Sessions Sidebar */}
        <div className="sessions-sidebar">
          <h3 className="sidebar-title">Próximas Clases</h3>
          <div className="sessions-list">
            {sessions.slice(0, 10).map(session => {
              const isSelected = selectedSession?.id === session.id;

              return (
                <div
                  key={session.id}
                  className={`session-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="session-info">
                    <div className="session-name">{session.name || session.courseName}</div>
                    <div className="session-group">{session.groupName || 'Sin grupo'}</div>
                    <div className="session-datetime">{formatDate(session.scheduledStart)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attendance Detail */}
        <div className="attendance-detail">
          {selectedSession && (
            <>
              <div className="detail-header">
                <div>
                  <h3 className="detail-title">{selectedSession.courseName}</h3>
                  <p className="detail-subtitle">
                    {selectedSession.groupName} • {formatDate(selectedSession.date)}
                  </p>
                </div>
                <BaseButton
                  variant="primary"
                  icon={CheckCircle}
                  onClick={handleMarkAllPresent}
                >
                  Marcar Todos Presentes
                </BaseButton>
              </div>

              <div className="students-list">
                {groupMembers.length === 0 ? (
                  <div className="empty-students">
                    <p>No hay estudiantes en este grupo</p>
                  </div>
                ) : (
                  groupMembers.map(member => {
                    const attStatus = getAttendanceStatus(member);

                    return (
                      <div key={member.id} className="student-item">
                        <div className="student-info">
                          <UserAvatar
                            userId={member.studentId || member.id}
                            name={member.studentName}
                            size="md"
                            className="student-avatar"
                          />
                          <div className="student-details">
                            <div className="student-name">{member.studentName}</div>
                            {attStatus && attStatus.linkClicked && (
                              <div className="link-clicked-badge">
                                <Video size={14} strokeWidth={2} className="inline-icon" /> Entró por link
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="student-status">
                          {attStatus ? (
                            <div className={`status-badge status-${attStatus.status}`}>
                              {getStatusIcon(attStatus.status)} {getStatusLabel(attStatus.status)}
                            </div>
                          ) : (
                            <div className="status-badge status-pending">
                              <Loader size={16} strokeWidth={2} className="inline-icon" /> Pendiente
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceView;
