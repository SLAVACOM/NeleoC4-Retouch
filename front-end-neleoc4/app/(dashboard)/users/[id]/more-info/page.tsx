'use client';
import { useEffect, useState } from 'react';
import { UsersService } from 'services/users.service';
import { UserMoreInfo } from 'types/user.interface';

import BackButton from './BackButton';
import CollapsibleSection from './CollapsibleSection';
import './page.css';

type MoreInfoProps = {
  params: Promise<{ id: string }>;
};

async function getUser(id: number): Promise<UserMoreInfo> {
  return await UsersService.getUserMoreInfo(id);
}

export default function Page({ params }: MoreInfoProps) {
  const [user, setUser] = useState<UserMoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const resolvedParams = await params;
        const userData = await getUser(Number(resolvedParams.id));
        setUser(userData);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Ошибка авторизации. Пожалуйста, войдите в систему.');
        } else if (err.response?.status === 403) {
          setError(
            'Ошибка доступа. У вас нет прав для выполнения этого действия.'
          );
        } else {
          setError('Ошибка загрузки пользователя');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [params]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page-container">
      <BackButton />
      <h1>Подробная информация о пользователе</h1>
      {user ? (
        <div className="user-info">
          <CollapsibleSection title="Основная информация">
            <div className="user-info-item">
              <strong>ID:</strong> {user.id}
            </div>
            <div className="user-info-item">
              <strong>Дата регистрации:</strong>{' '}
              {new Date(user.createdAt).toLocaleString()}
            </div>
            <div className="user-info-item">
              <strong>Дата изменения:</strong>{' '}
              {new Date(user.updatedAt).toLocaleString()}
            </div>
            <div className="user-info-item">
              <strong>Последняя активность:</strong>{' '}
              {new Date(user.lastActiveAt).toLocaleString()}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Telegram">
            <div className="user-info-item">
              <strong>Telegram ID:</strong> {user.telegramId}
            </div>
            <div className="user-info-item">
              <strong>Telegram Username:</strong> {user.telegramUsername}
            </div>
            <div className="user-info-item">
              <strong>Telegram Full Name:</strong> {user.telegramFullName}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Генерации и Платежи">
            <div className="user-info-item">
              <strong>Количество платных генераций:</strong>{' '}
              {user.paymentGenerationCount}
            </div>
            <div className="user-info-item">
              <strong>Количество бесплатных генераций:</strong>{' '}
              {user.freeGenerationCount}
            </div>
            <div className="user-info-item">
              <strong>Количество генераций:</strong> {user.generations.length}
            </div>
            <div className="user-info-item">
              <strong>Количество платежей:</strong> {user.payments.length}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Дополнительная информация">
            <div className="user-info-item">
              <strong>Язык:</strong> {user.language}
            </div>
            <div className="user-info-item">
              <strong>ID скидки:</strong> {user.discountId}
            </div>
            <div className="user-info-item">
              <strong>Настройки:</strong> {user.usersSettings.length}
            </div>
            <div className="user-info-item">
              <strong>Выбранные флаконы:</strong> {user.selectedVials.length}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Использованные промокоды">
            {user.usersUsePromocodes.map((promo) => (
              <CollapsibleSection
                key={promo.id}
                title={`Промокод ID: ${promo.promoCodeId}`}
                promoCodeId={promo.promoCodeId}
              >
                <div className="user-info-item">
                  <strong>Дата использования:</strong>{' '}
                  {new Date(promo.createdAt).toLocaleString()}
                </div>
              </CollapsibleSection>
            ))}
          </CollapsibleSection>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
