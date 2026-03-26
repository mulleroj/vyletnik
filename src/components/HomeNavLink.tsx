import { Link, type LinkProps } from 'react-router-dom';
import { IconBolt } from './Icons';

type Props = Omit<LinkProps, 'to'> & {
  iconSize?: number;
};

/**
 * Odkaz na úvodní stránku s ikonou elektrikářského blesku.
 */
export function HomeNavLink({ className = '', children, iconSize = 20, ...rest }: Props) {
  const onlyIcon = children == null || children === false;
  return (
    <Link
      to="/"
      className={`home-link ${className}`.trim()}
      aria-label={onlyIcon ? 'Úvodní stránka' : undefined}
      {...rest}
    >
      <IconBolt size={iconSize} className="home-link__icon" aria-hidden />
      {!onlyIcon && <span className="home-link__text">{children}</span>}
    </Link>
  );
}
