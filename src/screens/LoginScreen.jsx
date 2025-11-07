import { useNavigate } from 'react-router-dom';
import { BaseCard, BaseButton } from '../components/base';

/**
 * LoginScreen - Placeholder login screen
 *
 * TODO: Implement full authentication in Phase 2
 */
function LoginScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary dark:bg-primary-900 p-4">
      <BaseCard className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
            XIWENAPP V2
          </h1>
          <p className="text-text-secondary dark:text-neutral-400">
            Sign in to continue
          </p>
        </div>

        <div className="space-y-3">
          <BaseButton
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => navigate('/student')}
          >
            Continue as Student (Demo)
          </BaseButton>

          <BaseButton
            variant="secondary"
            fullWidth
            onClick={() => navigate('/teacher')}
          >
            Continue as Teacher (Coming Soon)
          </BaseButton>

          <BaseButton
            variant="secondary"
            fullWidth
            onClick={() => navigate('/admin')}
          >
            Continue as Admin (Coming Soon)
          </BaseButton>
        </div>

        <div className="mt-6 text-center text-xs text-text-secondary dark:text-neutral-400">
          <p>POC Version - Phase 2 of V2 Refactor</p>
          <p className="mt-1">Full authentication coming in later phases</p>
        </div>
      </BaseCard>
    </div>
  );
}

export default LoginScreen;
