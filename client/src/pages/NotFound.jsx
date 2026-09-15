import { Link } from 'react-router-dom';
import { useLang } from '../i18n/index.jsx';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="wrap">
      <div className="section narrow center">
        <h2 className="page-h">{t('Page not found')}</h2>
        <p className="page-p">{t('That link does not lead anywhere on this site.')}</p>
        <Link className="btn btn-primary" to="/">{t('Back to home')}</Link>
      </div>
    </div>
  );
}
