import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { QrCodeIcon, PenToolIcon, FileSignature } from 'lucide-react';
import { useTransactionToast } from '@/hooks/useToast';
import { useAttendance } from '@/hooks/useContract';
import { uploadBadgeMetadata, createBadgeMetadata } from '@/utils/metadata';
import { formatError } from '@/utils/formatters';
import { decodeEventLog } from 'viem'; // Import decodeEventLog
import { BADGE_NFT_ABI } from '@/hooks/useContract'; // Import BADGE_NFT_ABI

interface AttendanceFormData {
  eventId: string;
  verificationMethod: 'qr_code' | 'signature' | 'manual';
  qrSecret?: string;
  signature?: string;
  attendeeAddress?: string;
  notes?: string;
  badgeDescription?: string;
}

interface AttendanceFormProps {
  eventId: string;
  eventName: string;
  eventDate: Date;
  category: string;
  location: string;
  organizerAddress: string;
  onSuccess?: (tokenId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function AttendanceForm({
  eventId,
  eventName,
  eventDate,
  category,
  location,
  organizerAddress,
  onSuccess,
  onError,
  className = '',
}: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<'qr_code' | 'signature' | 'manual'>('qr_code');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useTransactionToast();
  const attendance = useAttendance();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AttendanceFormData>({
    defaultValues: {
      eventId,
      verificationMethod: 'qr_code',
    },
  });

  const verificationMethod = watch('verificationMethod');

  const onSubmit = async (data: AttendanceFormData) => {
    if (!attendance.contract) {
      toast.error('Contract not available', 'Please check your wallet connection');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create badge metadata
      const badgeData = createBadgeMetadata({
        eventId,
        eventName,
        eventDate,
        attendeeAddress: data.attendeeAddress || '', // Will be filled by contract
        organizer: organizerAddress,
        verificationMethod: data.verificationMethod,
        category,
        location,
        description: data.badgeDescription,
      });

      // Upload metadata to IPFS
      const metadataResult = await uploadBadgeMetadata(badgeData);
      toast.info('Uploading metadata', 'Badge metadata uploaded to IPFS');

      let tx;
      
      // Submit verification based on method
      switch (data.verificationMethod) {
        case 'qr_code':
          if (!data.qrSecret) {
            throw new Error('QR code secret is required');
          }
          tx = await attendance.verifyAttendanceByQR(
            parseInt(eventId),
            data.qrSecret,
            metadataResult.url
          );
          break;

        case 'signature':
          if (!data.signature) {
            throw new Error('Signature is required');
          }
          tx = await attendance.verifyAttendanceBySignature(
            parseInt(eventId),
            data.signature as `0x${string}`,
            metadataResult.url
          );
          break;

        case 'manual':
          if (!data.attendeeAddress) {
            throw new Error('Attendee address is required for manual verification');
          }
          tx = await attendance.verifyAttendanceManually(
            data.attendeeAddress,
            parseInt(eventId),
            data.notes || 'Manual verification',
            metadataResult.url
          );
          break;

        default:
          throw new Error('Invalid verification method');
      }

      toast.transactionPending(tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Find the BadgeIssued event to get token ID
      const badgeIssuedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = decodeEventLog({
            abi: BADGE_NFT_ABI,
            data: log.data,
            topics: log.topics,
          });
          return parsed?.eventName === 'BadgeIssued';
        } catch {
          return false;
        }
      });

      let tokenId = 'unknown';
      if (badgeIssuedEvent) {
        const parsed = decodeEventLog({
          abi: BADGE_NFT_ABI,
          data: badgeIssuedEvent.data,
          topics: badgeIssuedEvent.topics,
        });
        // Assuming `tokenId` is directly available in `args`
        if (parsed.eventName === 'BadgeIssued') {
          tokenId = (parsed.args as any).tokenId.toString();
        }
      }

      toast.transactionSuccess(tx.hash, 'Attendance verified and badge minted');
      
      if (onSuccess) {
        onSuccess(tokenId);
      }

      // Reset form
      reset();
      
    } catch (error) {
      console.error('Attendance verification failed:', error);
      const errorMessage = formatError(error);
      toast.transactionError(error, 'Attendance verification');
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMethodChange = (method: 'qr_code' | 'signature' | 'manual') => {
    setCurrentMethod(method);
    setValue('verificationMethod', method);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          // Try to parse as JSON (for exported signatures)
          const parsed = JSON.parse(content);
          if (parsed.signature) {
            setValue('signature', parsed.signature);
          }
        } catch {
          // If not JSON, treat as raw signature
          setValue('signature', content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="text-lg font-semibold">Verify Attendance</h3>
        <p className="text-sm text-gray-600">
          Choose a verification method to prove your attendance and mint your badge
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-6">
        {/* Verification Method Selection */}
        <div>
          <label className="form-label">Verification Method</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* QR Code Method */}
            <button
              type="button"
              onClick={() => handleMethodChange('qr_code')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                currentMethod === 'qr_code'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <QrCodeIcon className={`w-6 h-6 ${
                  currentMethod === 'qr_code' ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <div>
                  <div className="font-medium">QR Code</div>
                  <div className="text-sm text-gray-500">Scan event QR code</div>
                </div>
              </div>
            </button>

            {/* Signature Method */}
            <button
              type="button"
              onClick={() => handleMethodChange('signature')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                currentMethod === 'signature'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileSignature className={`w-6 h-6 ${
                  currentMethod === 'signature' ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <div>
                  <div className="font-medium">Signature</div>
                  <div className="text-sm text-gray-500">Digital signature</div>
                </div>
              </div>
            </button>

            {/* Manual Method */}
            <button
              type="button"
              onClick={() => handleMethodChange('manual')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                currentMethod === 'manual'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <PenToolIcon className={`w-6 h-6 ${
                  currentMethod === 'manual' ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <div>
                  <div className="font-medium">Manual</div>
                  <div className="text-sm text-gray-500">Organizer verification</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Method-specific Fields */}
        {verificationMethod === 'qr_code' && (
          <div>
            <label htmlFor="qrSecret" className="form-label">
              QR Code Secret
            </label>
            <input
              id="qrSecret"
              type="text"
              {...register('qrSecret', { 
                required: 'QR code secret is required',
                minLength: { value: 10, message: 'QR secret must be at least 10 characters' }
              })}
              className="form-input"
              placeholder="Enter the secret from the QR code"
            />
            {errors.qrSecret && (
              <p className="form-error">{errors.qrSecret.message}</p>
            )}
            <p className="form-help">
              Scan the QR code displayed at the event to get the secret
            </p>
          </div>
        )}

        {verificationMethod === 'signature' && (
          <div>
            <label htmlFor="signature" className="form-label">
              Digital Signature
            </label>
            <div className="space-y-3">
              <textarea
                id="signature"
                {...register('signature', { 
                  required: 'Signature is required',
                  minLength: { value: 50, message: 'Invalid signature format' }
                })}
                className="form-input"
                rows={4}
                placeholder="Paste your digital signature here"
              />
              
              {/* File Upload for Signature */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline btn-sm"
                >
                  Upload Signature File
                </button>
                <span className="text-sm text-gray-500">or paste above</span>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {errors.signature && (
              <p className="form-error">{errors.signature.message}</p>
            )}
            <p className="form-help">
              Upload or paste the digital signature provided by the organizer
            </p>
          </div>
        )}

        {verificationMethod === 'manual' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="attendeeAddress" className="form-label">
                Attendee Address
              </label>
              <input
                id="attendeeAddress"
                type="text"
                {...register('attendeeAddress', { 
                  required: 'Attendee address is required',
                  pattern: {
                    value: /^0x[a-fA-F0-9]{40}$/,
                    message: 'Invalid Ethereum address'
                  }
                })}
                className="form-input"
                placeholder="0x..."
              />
              {errors.attendeeAddress && (
                <p className="form-error">{errors.attendeeAddress.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="form-label">
                Verification Notes
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                className="form-input"
                rows={3}
                placeholder="Add any notes about the verification (optional)"
              />
            </div>
          </div>
        )}

        {/* Badge Description */}
        <div>
          <label htmlFor="badgeDescription" className="form-label">
            Badge Description (Optional)
          </label>
          <textarea
            id="badgeDescription"
            {...register('badgeDescription')}
            className="form-input"
            rows={3}
            placeholder="Customize your badge description"
          />
          <p className="form-help">
            Add a personal touch to your attendance badge
          </p>
        </div>

        {/* Event Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Event Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Event:</strong> {eventName}</div>
            <div><strong>Date:</strong> {eventDate.toLocaleDateString()}</div>
            <div><strong>Location:</strong> {location}</div>
            <div><strong>Category:</strong> {category}</div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="spinner-sm mr-2"></div>
                Verifying...
              </>
            ) : (
              'Verify Attendance & Mint Badge'
            )}
          </button>
          
          <button
            type="button"
            onClick={() => reset()}
            disabled={isSubmitting}
            className="btn btn-outline"
          >
            Reset
          </button>
        </div>

        {/* Info Alert */}
        <div className="alert alert-info">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Note:</strong> Verifying attendance will mint an NFT badge to your wallet. 
            This action cannot be undone, and you can only verify attendance once per event.
          </div>
        </div>
      </form>
    </div>
  );
}

/**
 * Simplified attendance verification component for QR code scanning
 */
interface QuickQRVerificationProps {
  eventId: string;
  onSuccess?: (tokenId: string) => void;
  onError?: (error: string) => void;
}

export function QuickQRVerification({ eventId, onSuccess, onError }: QuickQRVerificationProps) {
  const [qrSecret, setQrSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useTransactionToast();
  const attendance = useAttendance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qrSecret) {
      toast.error('QR Secret Required', 'Please enter the QR code secret');
      return;
    }

    setIsSubmitting(true);

    try {
      // For quick verification, use minimal metadata
      const metadataURI = `https://api.mintmark.app/metadata/quick-${eventId}-${Date.now()}.json`;
      
      const tx = await attendance.verifyAttendanceByQR(
        parseInt(eventId),
        qrSecret,
        metadataURI
      );

      toast.transactionPending(tx.hash);
      await tx.wait();
      toast.transactionSuccess(tx.hash, 'Attendance verified');
      
      if (onSuccess) {
        onSuccess('unknown'); // Token ID would need to be extracted from events
      }

      setQrSecret('');
      
    } catch (error) {
      console.error('Quick verification failed:', error);
      const errorMessage = formatError(error);
      toast.transactionError(error, 'Quick verification');
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="qrSecret" className="form-label">
          QR Code Secret
        </label>
        <input
          id="qrSecret"
          type="text"
          value={qrSecret}
          onChange={(e) => setQrSecret(e.target.value)}
          className="form-input"
          placeholder="Enter QR code secret"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !qrSecret}
        className="btn btn-primary w-full"
      >
        {isSubmitting ? (
          <>
            <div className="spinner-sm mr-2"></div>
            Verifying...
          </>
        ) : (
          'Quick Verify'
        )}
      </button>
    </form>
  );
}
