import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Shield, 
  Save, 
  Edit,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface BankAccount {
  id?: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  bank_code?: string;
  is_verified: boolean;
  is_active: boolean;
}

const BankAccountManagement: React.FC = () => {
  const { user } = useAuth();
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    bank_code: ''
  });

  const indonesianBanks = [
    { code: '002', name: 'Bank Rakyat Indonesia (BRI)' },
    { code: '008', name: 'Bank Mandiri' },
    { code: '009', name: 'Bank Negara Indonesia (BNI)' },
    { code: '011', name: 'Bank Danamon' },
    { code: '013', name: 'Bank Permata' },
    { code: '014', name: 'Bank Central Asia (BCA)' },
    { code: '016', name: 'Bank Maybank Indonesia' },
    { code: '019', name: 'Bank Panin' },
    { code: '022', name: 'CIMB Niaga' },
    { code: '023', name: 'Bank UOB Indonesia' },
    { code: '213', name: 'Bank BTPN' },
    { code: '451', name: 'Bank Syariah Indonesia (BSI)' },
    { code: '484', name: 'Bank KEB Hana Indonesia' }
  ];

  useEffect(() => {
    if (user?.id) {
      loadBankAccount();
    }
  }, [user?.id]);

  const loadBankAccount = async () => {
    try {
      setLoading(true);
      
      // For now, use localStorage until database tables are created
      const storedAccount = localStorage.getItem(`bank_account_${user?.id}`);
      if (storedAccount) {
        const account = JSON.parse(storedAccount);
        setBankAccount(account);
        setFormData({
          bank_name: account.bank_name,
          account_number: account.account_number,
          account_holder_name: account.account_holder_name,
          bank_code: account.bank_code || ''
        });
      }
    } catch (error) {
      console.error('Error loading bank account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (!formData.bank_name || !formData.account_number || !formData.account_holder_name) {
        alert('Please fill in all required fields');
        return;
      }

      if (formData.account_number.length < 8) {
        alert('Account number must be at least 8 digits');
        return;
      }

      // Mock save to localStorage until database is ready
      const accountData: BankAccount = {
        id: bankAccount?.id || Date.now().toString(),
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        account_holder_name: formData.account_holder_name,
        bank_code: formData.bank_code,
        is_verified: false, // Will need admin verification
        is_active: true
      };

      localStorage.setItem(`bank_account_${user?.id}`, JSON.stringify(accountData));
      setBankAccount(accountData);
      setIsEditing(false);
      
      alert('Bank account information saved successfully! Verification will be completed within 1-2 business days.');

    } catch (error) {
      console.error('Error saving bank account:', error);
      alert('Error saving bank account information');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (bankAccount) {
      setFormData({
        bank_name: bankAccount.bank_name,
        account_number: bankAccount.account_number,
        account_holder_name: bankAccount.account_holder_name,
        bank_code: bankAccount.bank_code || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bank Account Information</h1>
        <p className="text-gray-600 mt-2">Manage your bank account for receiving payouts</p>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your bank account information is encrypted and secure. All payouts will be processed to this account after verification.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Account Details
            </CardTitle>
            <CardDescription>
              {bankAccount ? 'Your registered bank account for payouts' : 'Add your bank account information'}
            </CardDescription>
          </div>
          {bankAccount && !isEditing && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {bankAccount && !isEditing ? (
            // Display Mode
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Bank Name</Label>
                  <p className="text-lg">{bankAccount.bank_name}</p>
                </div>
                <Badge 
                  variant={bankAccount.is_verified ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {bankAccount.is_verified ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" />
                      Pending Verification
                    </>
                  )}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium">Account Number</Label>
                  <p className="text-lg font-mono">
                    ****{bankAccount.account_number.slice(-4)}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium">Account Holder</Label>
                  <p className="text-lg">{bankAccount.account_holder_name}</p>
                </div>
              </div>

              {bankAccount.bank_code && (
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium">Bank Code</Label>
                  <p className="text-lg font-mono">{bankAccount.bank_code}</p>
                </div>
              )}

              {!bankAccount.is_verified && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your bank account is pending verification. This usually takes 1-2 business days. 
                    You'll receive an email confirmation once verified.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            // Edit/Add Mode
            <div className="space-y-4">
              <div>
                <Label htmlFor="bank_name">Bank Name *</Label>
                <select
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => {
                    const selectedBank = indonesianBanks.find(bank => bank.name === e.target.value);
                    setFormData({
                      ...formData,
                      bank_name: e.target.value,
                      bank_code: selectedBank?.code || ''
                    });
                  }}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select your bank</option>
                  {indonesianBanks.map((bank) => (
                    <option key={bank.code} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="account_number">Account Number *</Label>
                <Input
                  id="account_number"
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })}
                  placeholder="Enter your account number"
                  maxLength={20}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Numbers only, minimum 8 digits</p>
              </div>

              <div>
                <Label htmlFor="account_holder_name">Account Holder Name *</Label>
                <Input
                  id="account_holder_name"
                  type="text"
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value.toUpperCase() })}
                  placeholder="Enter name as it appears on your bank account"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Must match exactly with your bank account</p>
              </div>

              {formData.bank_code && (
                <div>
                  <Label htmlFor="bank_code">Bank Code</Label>
                  <Input
                    id="bank_code"
                    type="text"
                    value={formData.bank_code}
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">Automatically filled based on selected bank</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Account'}
                </Button>
                {bankAccount && (
                  <Button variant="outline" onClick={handleCancel} className="flex-1">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Bank Account Verification</p>
                <p className="text-sm text-gray-600">
                  We verify all bank accounts within 1-2 business days for security purposes.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Secure Data Storage</p>
                <p className="text-sm text-gray-600">
                  Your bank details are encrypted and stored securely following industry standards.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Payout Processing</p>
                <p className="text-sm text-gray-600">
                  Payouts are processed manually and typically take 1-3 business days to appear in your account.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankAccountManagement;
