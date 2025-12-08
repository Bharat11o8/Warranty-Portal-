import { Card } from "@/components/ui/card";

const WarrantyList = ({ items, showReason = false }: { items: any[], showReason?: boolean }) => {
    if (items.length === 0) {
        return (
            <Card className="border-dashed">
                <CardHeader>
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                        <Package className="h-16 w-16" />
                    </div>
                    <CardTitle className="text-center">No Warranties Found</CardTitle>
                    <CardDescription className="text-center">
                        No warranties in this category
                    </CardDescription>
                </CardHeader>
                {items === warranties && (
                    <CardContent>
                        <Link to="/warranty">
                            <Button variant="outline" className="w-full">
                                Register Customer Product
                            </Button>
                        </Link>
                    </CardContent>
                )}
            </Card>
        );
    }

    return (
        <div className="grid gap-4">
            {items.map((warranty) => {
                // Handle product_details - it might be a string or already an object
                const productDetails = typeof warranty.product_details === 'string'
                    ? JSON.parse(warranty.product_details)
                    : warranty.product_details || {};
                const productNameMapping: Record<string, string> = {
                    'paint-protection': 'Paint Protection Films',
                    'sun-protection': 'Sun Protection Films',
                };

                const rawProductName = productDetails.product || productDetails.productName || warranty.product_type;
                const productName = productNameMapping[rawProductName] || rawProductName;

                return (
                    <Card key={warranty.uid || warranty.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    {/* Product Name (Bold, Uppercase) and Product Type (Small, Normal) */}
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <h3 className="text-lg font-bold uppercase tracking-wide">
                                            {productName.replace(/-/g, ' ')}
                                        </h3>
                                        <span className="text-sm text-muted-foreground normal-case">
                                            {warranty.product_type}
                                        </span>
                                    </div>

                                    {/* Registered Date */}
                                    <p className="text-sm text-muted-foreground">
                                        Registered on {new Date(warranty.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>

                                {/* Status Badge */}
                                <Badge variant={
                                    warranty.status === 'validated' ? 'default' :
                                        warranty.status === 'rejected' ? 'destructive' : 'secondary'
                                } className={warranty.status === 'validated' ? 'bg-green-600' : ''}>
                                    {warranty.status}
                                </Badge>
                            </div>

                            {/* Warranty Details Grid */}
                            <div className={`grid grid-cols-2 ${warranty.product_type === 'ev-products' ? 'md:grid-cols-6' : warranty.product_type === 'seat-cover' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 mt-4 pt-4 border-t`}>
                                {/* UID - Only for seat-cover */}
                                {warranty.product_type === 'seat-cover' && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">UID</p>
                                        <p className="font-mono text-sm font-semibold">{warranty.uid || productDetails.uid || 'N/A'}</p>
                                    </div>
                                )}

                                {/* EV Product Identifiers */}
                                {warranty.product_type === 'ev-products' && (
                                    <>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Lot Number</p>
                                            <p className="font-mono text-sm font-semibold">{productDetails.lotNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Roll Number</p>
                                            <p className="font-mono text-sm font-semibold">{productDetails.rollNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vehicle Reg</p>
                                            <p className="font-mono text-sm font-semibold">{productDetails.carRegistration || warranty.car_reg || 'N/A'}</p>
                                        </div>
                                    </>
                                )}

                                {/* Warranty Type */}
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Warranty Type</p>
                                    <p className="text-sm font-medium">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                                            {warranty.warranty_type || '1 Year'}
                                        </span>
                                    </p>
                                </div>

                                {/* Vehicle */}
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vehicle</p>
                                    <p className="text-sm font-medium">{warranty.car_make} {warranty.car_model}</p>
                                    {warranty.car_year && (
                                        <p className="text-xs text-muted-foreground">{warranty.car_year}</p>
                                    )}
                                </div>

                                {/* Invoice */}
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Invoice</p>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 w-full">
                                                <FileText className="h-3 w-3 mr-1" />
                                                View
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Invoice Document</DialogTitle>
                                                <DialogDescription>
                                                    Uploaded invoice for {productName.replace(/-/g, ' ')}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="mt-4">
                                                {(() => {
                                                    const invoiceFile = warranty.product_type === 'ev-products'
                                                        ? productDetails.photos?.warranty
                                                        : productDetails.invoiceFileName;

                                                    if (invoiceFile) {
                                                        return (
                                                            <div className="space-y-4">
                                                                <div className="border rounded-lg p-4 bg-muted/50">
                                                                    <img
                                                                        src={`http://localhost:3000/uploads/${invoiceFile}`}
                                                                        alt="Invoice"
                                                                        className="w-full h-auto rounded"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                                                                            if (nextEl) nextEl.classList.remove('hidden');
                                                                        }}
                                                                    />
                                                                    <div className="hidden text-center py-8 text-muted-foreground">
                                                                        <FileText className="h-16 w-16 mx-auto mb-2" />
                                                                        <p>Preview not available (PDF or other format)</p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    className="w-full"
                                                                    onClick={() => {
                                                                        const fileUrl = `http://localhost:3000/uploads/${invoiceFile}`;

                                                                        fetch(fileUrl)
                                                                            .then(res => res.blob())
                                                                            .then(blob => {
                                                                                const blobUrl = window.URL.createObjectURL(blob);
                                                                                const link = document.createElement("a");
                                                                                link.href = blobUrl;
                                                                                link.download = invoiceFile;
                                                                                document.body.appendChild(link);
                                                                                link.click();
                                                                                link.remove();
                                                                                window.URL.revokeObjectURL(blobUrl);
                                                                            })
                                                                            .catch(err => console.error("Download failed", err));
                                                                    }}
                                                                >
                                                                    <Download className="h-4 w-4 mr-2" />
                                                                    Download Document
                                                                </Button>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                <FileText className="h-16 w-16 mx-auto mb-2" />
                                                                <p>No invoice uploaded</p>
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* View Details */}
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Details</p>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 w-full">
                                                <Eye className="h-3 w-3 mr-1" />
                                                View
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl">Warranty Registration Details</DialogTitle>
                                                <DialogDescription>
                                                    Complete information for {productName.replace(/-/g, ' ')}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="mt-6 space-y-6">
                                                {/* Product Information */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Product Information</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Product Name</p>
                                                            <p className="font-medium">{productName.replace(/-/g, ' ').toUpperCase()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Product Type</p>
                                                            <p className="font-medium">{warranty.product_type}</p>
                                                        </div>
                                                        {warranty.product_type === 'ev-products' ? (
                                                            <>
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Lot Number</p>
                                                                    <p className="font-mono font-medium">{productDetails.lotNumber || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Roll Number</p>
                                                                    <p className="font-mono font-medium">{productDetails.rollNumber || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Vehicle Reg</p>
                                                                    <p className="font-mono font-medium">{productDetails.carRegistration || warranty.car_reg || 'N/A'}</p>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">UID</p>
                                                                <p className="font-mono font-medium">{warranty.uid || productDetails.uid || 'N/A'}</p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Warranty Type</p>
                                                            <p className="font-medium">{warranty.warranty_type || '1 Year'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Purchase Date</p>
                                                            <p className="font-medium">{new Date(warranty.purchase_date).toLocaleDateString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Registration Date</p>
                                                            <p className="font-medium">{new Date(warranty.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* EV Product Photos */}
                                                {warranty.product_type === 'ev-products' && productDetails.photos && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Photo Documentation</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            {Object.entries(productDetails.photos).map(([key, filename]) => {
                                                                const labels: Record<string, string> = {
                                                                    lhs: 'Left Hand Side',
                                                                    rhs: 'Right Hand Side',
                                                                    frontReg: 'Front with Reg No.',
                                                                    backReg: 'Back with Reg No.',
                                                                    warranty: 'Warranty Card'
                                                                };
                                                                if (!filename) return null;
                                                                return (
                                                                    <div key={key} className="space-y-2">
                                                                        <p className="text-sm font-medium text-muted-foreground">{labels[key] || key}</p>
                                                                        <div className="border rounded-lg overflow-hidden bg-muted/50 aspect-video relative group">
                                                                            <img
                                                                                src={`http://localhost:3000/uploads/${filename}`}
                                                                                alt={labels[key]}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <a
                                                                                    href={`http://localhost:3000/uploads/${filename}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-white text-xs bg-black/50 px-2 py-1 rounded hover:bg-black/70"
                                                                                >
                                                                                    View Full
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Seat Cover Documentation */}
                                                {warranty.product_type === 'seat-cover' && productDetails.invoiceFileName && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Documentation</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <p className="text-sm font-medium text-muted-foreground">Invoice / MRP Sticker</p>
                                                                <div className="border rounded-lg overflow-hidden bg-muted/50 aspect-video relative group">
                                                                    <img
                                                                        src={`http://localhost:3000/uploads/${productDetails.invoiceFileName}`}
                                                                        alt="Invoice"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <a
                                                                            href={`http://localhost:3000/uploads/${productDetails.invoiceFileName}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-white text-xs bg-black/50 px-2 py-1 rounded hover:bg-black/70"
                                                                        >
                                                                            View Full
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Customer Information */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Customer Information</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Name</p>
                                                            <p className="font-medium">{warranty.customer_name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Email</p>
                                                            <p className="font-medium">{warranty.customer_email}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Phone</p>
                                                            <p className="font-medium">{warranty.customer_phone}</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-sm text-muted-foreground">Address</p>
                                                            <p className="font-medium">{warranty.customer_address}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Vehicle Information */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Vehicle Information</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Make</p>
                                                            <p className="font-medium">{warranty.car_make}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Model</p>
                                                            <p className="font-medium">{warranty.car_model}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Year</p>
                                                            <p className="font-medium">{warranty.car_year}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Installer Information */}
                                                {warranty.installer_name && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Installer Information</h3>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Store Name</p>
                                                                <p className="font-medium">{productDetails.storeName || warranty.installer_name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Store Email</p>
                                                                <p className="font-medium">{productDetails.storeEmail || warranty.installer_contact}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Purchase Date</p>
                                                                <p className="font-medium">{new Date(warranty.purchase_date).toLocaleDateString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Manpower (Installer)</p>
                                                                <p className="font-medium">
                                                                    {productDetails.manpowerName ||
                                                                        warranty.manpower_name_from_db ||
                                                                        productDetails.installerName ||
                                                                        (warranty.manpower_id ? `ID: ${warranty.manpower_id}` : 'N/A')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Status */}
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Status</h3>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={
                                                            warranty.status === 'validated' ? 'default' :
                                                                warranty.status === 'rejected' ? 'destructive' : 'secondary'
                                                        } className={warranty.status === 'validated' ? 'bg-green-600' : ''}>
                                                            {warranty.status.toUpperCase()}
                                                        </Badge>
                                                        {warranty.rejection_reason && (
                                                            <p className="text-sm text-destructive">Reason: {warranty.rejection_reason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            {/* Rejection Reason */}
                            {showReason && warranty.rejection_reason && (
                                <div className="mt-4 p-3 bg-destructive/10 rounded-md text-destructive">
                                    <p className="font-semibold mb-1 text-sm">Reason for Rejection:</p>
                                    <p className="text-sm">{warranty.rejection_reason}</p>
                                </div>
                            )}

                            {/* Edit Button for Rejected Warranties */}
                            {warranty.status === 'rejected' && (
                                <Button
                                    onClick={() => setEditingWarranty(warranty)}
                                    variant="outline"
                                    className="w-full mt-4"
                                >
                                    <Edit className="mr-2 h-4 w-4" /> Edit & Resubmit
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
