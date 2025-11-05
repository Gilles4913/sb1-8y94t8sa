import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Mail, Server, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Layout } from './Layout';
import { useAuth } from '../contexts/AuthContext';

interface EnvCheckResult {
  RESEND_API_KEY: boolean;
  VITE_PUBLIC_BASE_URL: boolean;
  timestamp: string;
}

interface DomainStatus {
  id: string;
  name: string;
  status: 'verified' | 'pending' | 'failed' | 'temporary_failure';
  created_at: string;
}

interface EmailTestLog {
  id: string;
  user_id: string;
  to_email: string;
  status: string;
  response_json: any;
  created_at: string;
}

export function ResendDiagnostic() {
  const { profile } = useAuth();
  const [envCheck, setEnvCheck] = useState<EnvCheckResult | null>(null);
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailTestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      const envUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/env-check`;
      const envResponse = await fetch(envUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (envResponse.ok) {
        const envData = await envResponse.json();
        setEnvCheck(envData);
      }

      const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
      if (resendApiKey) {
        const domainsResponse = await fetch('https://api.resend.com/domains', {
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
          },
        });

        if (domainsResponse.ok) {
          const domainsData = await domainsResponse.json();
          const domain = domainsData.data?.find((d: any) =>
            d.name === 'notifications.a2display.fr'
          );
          if (domain) {
            setDomainStatus(domain);
          }
        }
      }

      const { data: logs, error: logsError } = await supabase
        .from('email_test_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (logsError) {
        console.error('Error fetching email logs:', logsError);
      } else if (logs) {
        setEmailLogs(logs);
      }

    } catch (err: any) {
      console.error('Error fetching diagnostics:', err);
      setError(err.message || 'Erreur lors du chargement des diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? (
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      );
    }

    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case 'verified':
        return (
          <span className={`${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`}>
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className={`${baseClasses} bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400`}>
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'sent':
        return (
          <span className={`${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`}>
            Sent
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`}>
            Failed
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300`}>
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600 dark:text-slate-400">Chargement des diagnostics...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Diagnostic Resend
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              État des services et configuration email
            </p>
          </div>
          <button
            onClick={fetchDiagnostics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-300">Erreur</h3>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Variables d'environnement
              </h2>
            </div>
          </div>
          <div className="p-6">
            {envCheck ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    RESEND_API_KEY
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(envCheck.RESEND_API_KEY)}
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {envCheck.RESEND_API_KEY ? 'Configuré' : 'Manquant'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    VITE_PUBLIC_BASE_URL
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(envCheck.VITE_PUBLIC_BASE_URL)}
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {envCheck.VITE_PUBLIC_BASE_URL ? 'Configuré' : 'Manquant'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
                  Dernière vérification: {new Date(envCheck.timestamp).toLocaleString('fr-FR')}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Impossible de récupérer les variables d'environnement
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Statut du domaine Resend
              </h2>
            </div>
          </div>
          <div className="p-6">
            {domainStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {domainStatus.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(domainStatus.status)}
                    {getStatusBadge(domainStatus.status)}
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Créé le: {new Date(domainStatus.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-900 dark:text-amber-300">
                    Impossible de récupérer le statut du domaine
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Vérifiez que VITE_RESEND_API_KEY est configuré
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Derniers tests d'emails
              </h2>
            </div>
          </div>
          <div className="p-6">
            {emailLogs.length > 0 ? (
              <div className="space-y-3">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {log.to_email}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(log.status)}
                      {log.response_json?.id && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {log.response_json.id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Aucun test d'email enregistré
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
