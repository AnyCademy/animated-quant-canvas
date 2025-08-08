import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Check,
  X,
  CreditCard,
  FileText
} from 'lucide-react';
import {
  getAdminPayoutSummary,
  getPendingPayoutRequests,
  approvePayoutRequest,
  completePayoutRequest,
  cancelPayoutRequest,
  createBatchPayout,
  getInstructorBankAccount,
  setBankVerificationStatus,
  listInstructorBankAccounts,
  type PayoutBatch,
  type AdminPayoutSummary
} from '@/lib/payoutManager';

const AdminPayouts: React.FC = () => {
  const [summary, setSummary] = useState<AdminPayoutSummary>({
    pending_requests: 0,
    total_pending_amount: 0,
    processing_batches: 0,
    completed_this_month: 0,
    instructors_awaiting_payout: 0
  });
  const [pendingPayouts, setPendingPayouts] = useState<PayoutBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutBatch | null>(null);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [allBankAccounts, setAllBankAccounts] = useState<any[]>([]);
  const [verifying, setVerifying] = useState(false);

  // Form states
  const [batchReference, setBatchReference] = useState('');
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, pendingData, accounts] = await Promise.all([
        getAdminPayoutSummary(),
        getPendingPayoutRequests(),
        listInstructorBankAccounts(),
      ]);
      
      setSummary(summaryData);
      setPendingPayouts(pendingData);
      setAllBankAccounts(accounts);
    } catch (error) {
      console.error('Error loading admin payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewPayout = async (payout: PayoutBatch) => {
    setSelectedPayout(payout);
    const account = await getInstructorBankAccount(payout.instructor_id);
    setBankAccount(account);
    setViewDialogOpen(true);
  };

  const handleToggleVerification = async () => {
    if (!selectedPayout || !bankAccount) return;
    try {
      setVerifying(true);
      const next = !bankAccount.is_verified;
      const ok = await setBankVerificationStatus(selectedPayout.instructor_id, next);
      if (ok) {
        const refreshed = await getInstructorBankAccount(selectedPayout.instructor_id);
        setBankAccount(refreshed);
        alert(`Bank account ${next ? 'verified' : 'unverified'} successfully.`);
      } else {
        alert('Failed to update verification status');
      }
    } catch (e) {
      console.error('Verification toggle error:', e);
      alert('Error updating verification status');
    } finally {
      setVerifying(false);
    }
  };

  const handleApprovePayout = async () => {
    if (!selectedPayout) return;

    try {
      setProcessingAction('approve');
      const success = await approvePayoutRequest(
        selectedPayout.id!,
        batchReference || `BATCH-${Date.now()}`,
        notes
      );

      if (success) {
        await loadData();
        setApproveDialogOpen(false);
        setBatchReference('');
        setNotes('');
        alert('Payout approved successfully!');
      } else {
        alert('Failed to approve payout');
      }
    } catch (error) {
      console.error('Error approving payout:', error);
      alert('Error approving payout');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCancelPayout = async () => {
    if (!selectedPayout) return;

    try {
      setProcessingAction('cancel');
      const success = await cancelPayoutRequest(
        selectedPayout.id!,
        cancelReason
      );

      if (success) {
        await loadData();
        setCancelDialogOpen(false);
        setCancelReason('');
        alert('Payout cancelled successfully!');
      } else {
        alert('Failed to cancel payout');
      }
    } catch (error) {
      console.error('Error cancelling payout:', error);
      alert('Error cancelling payout');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBatchApproval = async () => {
    if (selectedPayouts.length === 0) return;

    try {
      setProcessingAction('batch');
      const instructorIds = selectedPayouts.map(id => {
        const payout = pendingPayouts.find(p => p.id === id);
        return payout?.instructor_id;
      }).filter(Boolean) as string[];

      const success = await createBatchPayout(instructorIds);

      if (success) {
        await loadData();
        setSelectedPayouts([]);
        alert(`Batch payout created for ${selectedPayouts.length} requests!`);
      } else {
        alert('Failed to create batch payout');
      }
    } catch (error) {
      console.error('Error creating batch payout:', error);
      alert('Error creating batch payout');
    } finally {
      setProcessingAction(null);
    }
  };

  const togglePayoutSelection = (payoutId: string) => {
    setSelectedPayouts(prev => 
      prev.includes(payoutId) 
        ? prev.filter(id => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  const selectAllPayouts = () => {
    setSelectedPayouts(pendingPayouts.map(p => p.id!));
  };

  const clearSelection = () => {
    setSelectedPayouts([]);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
        <p className="text-gray-600 mt-2">Manage instructor payouts and process transfers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pending_requests}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.total_pending_amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.processing_batches}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completed_this_month}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructors Waiting</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.instructors_awaiting_payout}</div>
            <p className="text-xs text-muted-foreground">
              Unique instructors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_pending_amount)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting transfer
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {/* Batch Actions */}
          {selectedPayouts.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedPayouts.length} payout(s) selected</span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleBatchApproval}
                    disabled={processingAction === 'batch'}
                  >
                    {processingAction === 'batch' ? 'Processing...' : 'Approve Selected'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Payout Requests</CardTitle>
                <CardDescription>Review and approve instructor payout requests</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllPayouts}>
                  Select All
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPayouts.map((payout) => (
                  <div 
                    key={payout.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      selectedPayouts.includes(payout.id!) ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedPayouts.includes(payout.id!)}
                        onChange={() => togglePayoutSelection(payout.id!)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">Instructor ID: {payout.instructor_id}</h4>
                        <p className="text-sm text-muted-foreground">
                          Requested: {new Date(payout.created_at!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right mr-4">
                      <p className="font-medium">{formatCurrency(payout.total_amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payout.payout_method.replace('_', ' ')}
                      </p>
                    </div>

                    <Badge variant="outline">{payout.status}</Badge>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPayout(payout)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedPayout(payout)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve Payout Request</DialogTitle>
                            <DialogDescription>
                              Approve payout of {formatCurrency(payout.total_amount)} for instructor
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="batch_reference">Batch Reference</Label>
                              <Input
                                id="batch_reference"
                                value={batchReference}
                                onChange={(e) => setBatchReference(e.target.value)}
                                placeholder={`BATCH-${Date.now()}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor="notes">Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes for this payout..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleApprovePayout}
                                disabled={processingAction === 'approve'}
                              >
                                {processingAction === 'approve' ? 'Processing...' : 'Approve Payout'}
                              </Button>
                              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPayout(payout)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancel Payout Request</DialogTitle>
                            <DialogDescription>
                              Cancel payout of {formatCurrency(payout.total_amount)} for instructor
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="cancel_reason">Cancellation Reason</Label>
                              <Textarea
                                id="cancel_reason"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Reason for cancelling this payout..."
                                required
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="destructive"
                                onClick={handleCancelPayout}
                                disabled={processingAction === 'cancel' || !cancelReason.trim()}
                              >
                                {processingAction === 'cancel' ? 'Processing...' : 'Cancel Payout'}
                              </Button>
                              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                                Close
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}

                {pendingPayouts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No pending payout requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>Processing Payouts</CardTitle>
              <CardDescription>Payouts currently being processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payouts currently being processed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Payouts</CardTitle>
              <CardDescription>Recently completed payout transfers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">No completed payouts to display</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank-accounts" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Instructor Bank Accounts</CardTitle>
                <CardDescription>Review and verify instructor payout bank accounts</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allBankAccounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Instructor</span>
                        <code className="text-xs">{acc.instructor_id}</code>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label className="text-sm font-medium">Bank</Label>
                          <p>{acc.bank_name} {acc.bank_code ? `(${acc.bank_code})` : ''}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Account</Label>
                          <p className="font-mono">{acc.account_number}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Holder</Label>
                          <p>{acc.account_holder_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge variant={acc.is_verified ? 'default' : 'secondary'}>
                            {acc.is_verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        variant={acc.is_verified ? 'outline' : 'default'}
                        disabled={verifying}
                        onClick={async () => {
                          try {
                            setVerifying(true);
                            const ok = await setBankVerificationStatus(acc.instructor_id, !acc.is_verified);
                            if (ok) {
                              // refresh
                              const accounts = await listInstructorBankAccounts();
                              setAllBankAccounts(accounts);
                            } else {
                              alert('Failed to update verification');
                            }
                          } finally {
                            setVerifying(false);
                          }
                        }}
                      >
                        {verifying ? 'Updating...' : acc.is_verified ? 'Mark Unverified' : 'Mark Verified'}
                      </Button>
                    </div>
                  </div>
                ))}

                {allBankAccounts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No bank accounts found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Payout Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payout Request Details</DialogTitle>
            <DialogDescription>
              Complete information for this payout request
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-6">
              {/* Payout Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Request ID</Label>
                  <p className="text-lg">{selectedPayout.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-lg font-bold">{formatCurrency(selectedPayout.total_amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="outline">{selectedPayout.status}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Requested Date</Label>
                  <p>{new Date(selectedPayout.created_at!).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Bank Account Information */}
              {bankAccount && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bank Account Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Bank Name</Label>
                      <p>{bankAccount.bank_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Account Number</Label>
                      <p className="font-mono">{bankAccount.account_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Account Holder</Label>
                      <p>{bankAccount.account_holder_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Verification Status</Label>
                      <Badge variant={bankAccount.is_verified ? "default" : "secondary"}>
                        {bankAccount.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <Button
                        variant={bankAccount.is_verified ? 'outline' : 'default'}
                        onClick={handleToggleVerification}
                        disabled={verifying}
                      >
                        {verifying ? 'Updating...' : bankAccount.is_verified ? 'Mark as Unverified' : 'Mark as Verified'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPayout.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPayout.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayouts;
