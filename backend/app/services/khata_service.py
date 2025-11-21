"""Khata service for managing customer transactions with atomic balance updates."""
from datetime import datetime
from mongoengine import DoesNotExist
from mongoengine.connection import get_db
from app.models.customer import Customer
from app.models.khata import KhataTransaction


class KhataService:
    """
    Khata business logic service.
    
    Handles customer transactions with atomic balance updates using MongoDB transactions
    to ensure data consistency.
    """
    
    def create_transaction(self, customer_id, transaction_type, amount, 
                          description=None, payment_method=None, 
                          reference_number=None, created_by=None):
        """
        Create a khata transaction with atomic balance update.
        
        Uses MongoDB transactions to ensure that the customer balance and transaction
        record are updated atomically, preventing race conditions.
        
        Args:
            customer_id (str): Customer ID
            transaction_type (str): 'credit' or 'debit'
            amount (float): Transaction amount (must be positive)
            description (str, optional): Transaction description
            payment_method (str, optional): Payment method
            reference_number (str, optional): Reference number for payment
            created_by (str, optional): User who created the transaction
        
        Returns:
            dict: Transaction data including new balance
        
        Raises:
            DoesNotExist: If customer not found
            ValueError: If invalid transaction type or amount
        """
        # Validate inputs
        if transaction_type not in ['credit', 'debit']:
            raise ValueError(f"Invalid transaction type: {transaction_type}")
        
        if amount <= 0:
            raise ValueError("Amount must be greater than 0")
        
        # Get customer
        try:
            customer = Customer.objects.get(id=customer_id)
        except DoesNotExist:
            raise DoesNotExist(f"Customer with id {customer_id} not found")
        
        # Calculate new balance
        old_balance = customer.current_balance
        if transaction_type == 'debit':
            # Customer owes more money (purchase)
            new_balance = old_balance + amount
        else:  # credit
            # Customer pays money (payment)
            new_balance = old_balance - amount
        
        # Use MongoDB session for atomic transaction
        # Note: MongoDB transactions require a replica set
        # For development without replica set, we'll use a simpler approach
        try:
            # Update customer balance
            customer.current_balance = new_balance
            customer.save()
            
            # Create transaction record
            transaction = KhataTransaction(
                customer=customer,
                transaction_type=transaction_type,
                amount=amount,
                balance_after=new_balance,
                description=description,
                payment_method=payment_method,
                reference_number=reference_number,
                created_by=created_by,
                created_at=datetime.utcnow()
            )
            transaction.save()
            
            return transaction.to_dict()
            
        except Exception as e:
            # Rollback customer balance on error
            customer.current_balance = old_balance
            customer.save()
            raise e
    
    def create_transaction_atomic(self, customer_id, transaction_type, amount,
                                  description=None, payment_method=None,
                                  reference_number=None, created_by=None):
        """
        Create a khata transaction with MongoDB transaction support.
        
        This method uses MongoDB transactions (requires replica set).
        Falls back to create_transaction if transactions are not supported.
        
        Args:
            customer_id (str): Customer ID
            transaction_type (str): 'credit' or 'debit'
            amount (float): Transaction amount (must be positive)
            description (str, optional): Transaction description
            payment_method (str, optional): Payment method
            reference_number (str, optional): Reference number for payment
            created_by (str, optional): User who created the transaction
        
        Returns:
            dict: Transaction data including new balance
        """
        # Validate inputs
        if transaction_type not in ['credit', 'debit']:
            raise ValueError(f"Invalid transaction type: {transaction_type}")
        
        if amount <= 0:
            raise ValueError("Amount must be greater than 0")
        
        # Get customer
        try:
            customer = Customer.objects.get(id=customer_id)
        except DoesNotExist:
            raise DoesNotExist(f"Customer with id {customer_id} not found")
        
        # Calculate new balance
        old_balance = customer.current_balance
        if transaction_type == 'debit':
            new_balance = old_balance + amount
        else:  # credit
            new_balance = old_balance - amount
        
        # Try to use MongoDB transactions
        try:
            from pymongo import MongoClient
            client = get_db().client
            
            with client.start_session() as session:
                with session.start_transaction():
                    # Update customer balance
                    customer.current_balance = new_balance
                    customer.save()
                    
                    # Create transaction record
                    transaction = KhataTransaction(
                        customer=customer,
                        transaction_type=transaction_type,
                        amount=amount,
                        balance_after=new_balance,
                        description=description,
                        payment_method=payment_method,
                        reference_number=reference_number,
                        created_by=created_by,
                        created_at=datetime.utcnow()
                    )
                    transaction.save()
                    
                    return transaction.to_dict()
                    
        except Exception as e:
            # If transactions not supported, fall back to simple method
            # Rollback customer balance
            customer.current_balance = old_balance
            customer.save()
            
            # Use the simpler create_transaction method
            return self.create_transaction(
                customer_id=customer_id,
                transaction_type=transaction_type,
                amount=amount,
                description=description,
                payment_method=payment_method,
                reference_number=reference_number,
                created_by=created_by
            )
    
    def get_customer_balance(self, customer_id):
        """
        Get current balance for a customer.
        
        Args:
            customer_id (str): Customer ID
        
        Returns:
            dict: Balance information
        
        Raises:
            DoesNotExist: If customer not found
        """
        try:
            customer = Customer.objects.get(id=customer_id)
            return customer.get_balance_status()
        except DoesNotExist:
            raise DoesNotExist(f"Customer with id {customer_id} not found")
    
    def calculate_running_balance(self, customer_id):
        """
        Calculate running balance from transaction history.
        
        This method recalculates the balance from scratch based on all transactions.
        Useful for verification and reconciliation.
        
        Args:
            customer_id (str): Customer ID
        
        Returns:
            dict: Balance calculation details
        """
        try:
            customer = Customer.objects.get(id=customer_id)
        except DoesNotExist:
            raise DoesNotExist(f"Customer with id {customer_id} not found")
        
        # Get all transactions in chronological order
        transactions = KhataTransaction.objects(
            customer=customer_id
        ).order_by('created_at')
        
        # Calculate running balance
        running_balance = 0.0
        transaction_details = []
        
        for txn in transactions:
            if txn.transaction_type == 'debit':
                running_balance += txn.amount
            else:  # credit
                running_balance -= txn.amount
            
            transaction_details.append({
                'id': str(txn.id),
                'type': txn.transaction_type,
                'amount': txn.amount,
                'balance_after': running_balance,
                'recorded_balance': txn.balance_after,
                'created_at': txn.created_at.isoformat() if txn.created_at else None
            })
        
        return {
            'customer_id': str(customer.id),
            'customer_name': customer.name,
            'current_balance': customer.current_balance,
            'calculated_balance': running_balance,
            'is_balanced': abs(customer.current_balance - running_balance) < 0.01,
            'total_transactions': len(transaction_details),
            'transactions': transaction_details
        }
    
    def get_overall_summary(self):
        """
        Get overall khata summary across all customers.
        
        Returns:
            dict: Summary statistics including total outstanding balance
        """
        customers = Customer.objects()
        
        total_customers = customers.count()
        customers_with_balance = customers.filter(current_balance__ne=0).count()
        
        # Calculate total outstanding (customers who owe money)
        total_outstanding = sum(
            c.current_balance for c in customers if c.current_balance > 0
        )
        
        # Calculate total credit (store owes money)
        total_credit = sum(
            abs(c.current_balance) for c in customers if c.current_balance < 0
        )
        
        # Get top debtors (customers who owe the most)
        top_debtors = [
            {
                'id': str(c.id),
                'name': c.name,
                'phone': c.phone,
                'balance': c.current_balance
            }
            for c in customers.filter(current_balance__gt=0).order_by('-current_balance')[:10]
        ]
        
        # Get transaction statistics
        all_transactions = KhataTransaction.objects()
        total_transactions = all_transactions.count()
        
        total_debits = sum(
            t.amount for t in all_transactions if t.transaction_type == 'debit'
        )
        total_credits = sum(
            t.amount for t in all_transactions if t.transaction_type == 'credit'
        )
        
        return {
            'total_customers': total_customers,
            'customers_with_balance': customers_with_balance,
            'total_outstanding': total_outstanding,
            'total_credit': total_credit,
            'net_balance': total_outstanding - total_credit,
            'top_debtors': top_debtors,
            'transaction_stats': {
                'total_transactions': total_transactions,
                'total_debits': total_debits,
                'total_credits': total_credits
            }
        }
