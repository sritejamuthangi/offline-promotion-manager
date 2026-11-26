import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import {
  emailPayload,
  normalizeUrl,
  phonePayload,
  type QrPayloadKind,
  smsPayload,
  upiPayload,
  wifiPayload,
} from '@/core/qr';

const KINDS: QrPayloadKind[] = ['url', 'text', 'wifi', 'email', 'phone', 'sms', 'upi'];

export function QrDialog({
  open,
  onOpenChange,
  onInsert,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<QrPayloadKind>('url');
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [hidden, setHidden] = useState(false);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState('');
  const [message, setMessage] = useState('');
  const [payee, setPayee] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const build = (): string | undefined => {
    if (kind === 'url') return url.trim() ? normalizeUrl(url) : undefined;
    if (kind === 'text') return text.trim() || undefined;
    if (kind === 'wifi')
      return ssid.trim() ? wifiPayload({ ssid, password, encryption, hidden }) : undefined;
    if (kind === 'email')
      return email.trim() ? emailPayload({ to: email, subject, body }) : undefined;
    if (kind === 'phone') return phone.trim() ? phonePayload(phone) : undefined;
    if (kind === 'sms') return sms.trim() ? smsPayload({ number: sms, message }) : undefined;
    if (kind === 'upi')
      return payee.trim() ? upiPayload({ payee, name: payeeName, amount, note }) : undefined;
    return undefined;
  };

  const submit = () => {
    if (kind === 'upi' && amount.trim() && !(Number(amount) > 0)) {
      setError(t('editor.qr.invalidAmount'));
      return;
    }
    const value = build();
    if (!value) {
      setError(t('editor.qr.missingFields'));
      return;
    }
    setError('');
    onInsert(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editor.qrCode')}</DialogTitle>
          <DialogDescription>{t('editor.qr.hint')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="qr-kind" className="text-muted-foreground text-xs">
            {t('editor.qr.kind')}
          </Label>
          <NativeSelect
            id="qr-kind"
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as QrPayloadKind);
              setError('');
            }}
          >
            {KINDS.map((value) => (
              <option key={value} value={value}>
                {t(`editor.qr.kinds.${value}`)}
              </option>
            ))}
          </NativeSelect>
        </div>

        {kind === 'url' && (
          <Field label={t('editor.qr.link')} id="qr-url">
            <Input
              id="qr-url"
              type="url"
              inputMode="url"
              placeholder="example.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </Field>
        )}
        {kind === 'text' && (
          <Field label={t('editor.qr.text')} id="qr-text">
            <textarea
              id="qr-text"
              rows={3}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="w-full resize-y rounded-md border bg-background p-2 text-base outline-none focus:ring-2 focus:ring-ring lg:text-sm"
            />
          </Field>
        )}
        {kind === 'wifi' && (
          <>
            <Field label={t('editor.qr.ssid')} id="qr-ssid">
              <Input id="qr-ssid" value={ssid} onChange={(event) => setSsid(event.target.value)} />
            </Field>
            <Field label={t('editor.qr.encryption')} id="qr-encryption">
              <NativeSelect
                id="qr-encryption"
                value={encryption}
                onChange={(event) => setEncryption(event.target.value as 'WPA' | 'WEP' | 'nopass')}
              >
                <option value="WPA">WPA/WPA2/WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">{t('editor.qr.openNetwork')}</option>
              </NativeSelect>
            </Field>
            {encryption !== 'nopass' && (
              <Field label={t('editor.qr.password')} id="qr-password">
                <Input
                  id="qr-password"
                  type="text"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hidden}
                onChange={(event) => setHidden(event.target.checked)}
              />
              {t('editor.qr.hiddenNetwork')}
            </label>
          </>
        )}
        {kind === 'email' && (
          <>
            <Field label={t('editor.qr.to')} id="qr-email">
              <Input
                id="qr-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label={t('editor.qr.subject')} id="qr-subject">
              <Input
                id="qr-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </Field>
            <Field label={t('editor.qr.body')} id="qr-body">
              <textarea
                id="qr-body"
                rows={3}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="w-full resize-y rounded-md border bg-background p-2 text-base outline-none focus:ring-2 focus:ring-ring lg:text-sm"
              />
            </Field>
          </>
        )}
        {kind === 'phone' && (
          <Field label={t('editor.qr.phone')} id="qr-phone">
            <Input
              id="qr-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
        )}
        {kind === 'sms' && (
          <>
            <Field label={t('editor.qr.phone')} id="qr-sms">
              <Input
                id="qr-sms"
                type="tel"
                value={sms}
                onChange={(event) => setSms(event.target.value)}
              />
            </Field>
            <Field label={t('editor.qr.message')} id="qr-message">
              <textarea
                id="qr-message"
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="w-full resize-y rounded-md border bg-background p-2 text-base outline-none focus:ring-2 focus:ring-ring lg:text-sm"
              />
            </Field>
          </>
        )}
        {kind === 'upi' && (
          <>
            <Field label={t('editor.qr.payee')} id="qr-payee">
              <Input
                id="qr-payee"
                placeholder="name@bank"
                value={payee}
                onChange={(event) => setPayee(event.target.value)}
              />
            </Field>
            <Field label={t('editor.qr.payeeName')} id="qr-payee-name">
              <Input
                id="qr-payee-name"
                value={payeeName}
                onChange={(event) => setPayeeName(event.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('editor.qr.amount')} id="qr-amount">
                <Input
                  id="qr-amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </Field>
              <Field label={t('editor.qr.currency')} id="qr-currency">
                <Input id="qr-currency" value="INR" readOnly disabled />
              </Field>
            </div>
            <Field label={t('editor.qr.note')} id="qr-note">
              <Input id="qr-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
          </>
        )}

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={submit}>
            {t('editor.qr.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
