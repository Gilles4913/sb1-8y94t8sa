import { useState, useEffect } from 'react';
import { Mail, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Layout } from './Layout';
import { EmailTemplateEditor } from './EmailTemplateEditor';

interface EmailTemplate {
  id: string;
  type: string;
  subject: string;
  html_body: string;
  text_body: string;
  placeholders: string[];
  is_active: boolean;
  updated_at: string;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  invitation: 'Invitation initiale',
  reminder_5d: 'Rappel 5 jours',
  reminder_10d: 'Rappel 10 jours',
  confirmation: 'Confirmation de réponse',
  sponsor_ack: 'Accusé réception sponsor',
  campaign_summary: 'Résumé de campagne',
};

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('type');

      if (error) throw error;

      setTemplates(
        data.map((t) => ({
          ...t,
          placeholders: Array.isArray(t.placeholders)
            ? t.placeholders
            : JSON.parse(t.placeholders || '[]'),
        }))
      );
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Templates d'emails
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Gérez vos modèles d'emails automatiques
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">Chargement des templates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition shadow-sm hover:shadow-md p-6 cursor-pointer"
                onClick={() => setSelectedType(template.type)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {template.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  {TEMPLATE_TYPE_LABELS[template.type] || template.type}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                  {template.subject}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.placeholders.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded font-mono"
                    >
                      {`{{${p}}}`}
                    </span>
                  ))}
                  {template.placeholders.length > 3 && (
                    <span className="text-xs px-2 py-0.5 text-slate-500 dark:text-slate-500">
                      +{template.placeholders.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedType && (
          <EmailTemplateEditor
            templateType={selectedType}
            onClose={() => {
              setSelectedType(null);
              fetchTemplates();
            }}
          />
        )}
      </div>
    </Layout>
  );
}
