import { useEffect, useState } from 'react';
import { PromoCodeService } from 'services/promocode.service';
import { IPromoCode } from 'types/promocodes.interface';
import './collapsibleSection.css';

type CollapsibleSectionProps = {
  title: string;
  promoCodeId?: number;
  children: React.ReactNode;
};

export default function CollapsibleSection({
  title,
  promoCodeId,
  children
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoDetails] = useState<IPromoCode | null>(null);

  useEffect(() => {
    async function fetchPromoDetails() {
      const details = await PromoCodeService.getPromoCode(Number(promoCodeId));
      setPromoDetails(details);
    }
    if (isOpen && promoCodeId) fetchPromoDetails();
  }, [isOpen, promoCodeId]);

  return (
    <div className="collapsible-section">
      <button className="collapsible-header" onClick={() => setIsOpen(!isOpen)}>
        {title}
      </button>
      {isOpen && (
        <div className="collapsible-content">
          {promoCodeId && promoCode ? (
            <div>
              <strong>Промокод:</strong> {promoCode.code} <br />
              <strong>Описание:</strong> {promoCode.description} <br />
              <strong>Скидка:</strong> {}%
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
