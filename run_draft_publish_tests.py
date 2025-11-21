#!/usr/bin/env python3
"""
Test runner for draft/publish workflow tests.
Runs both unit tests and integration tests.
"""
import sys
import os
import subprocess

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))


def run_command(command, description):
    """Run a command and print results"""
    print(f"\n{'=' * 70}")
    print(f"{description}")
    print('=' * 70)
    
    result = subprocess.run(command, shell=True)
    return result.returncode == 0


def main():
    """Run all draft/publish tests"""
    print("=" * 70)
    print("DRAFT/PUBLISH WORKFLOW TEST SUITE")
    print("Task 13.1 - Testing and Quality Assurance")
    print("=" * 70)
    
    all_passed = True
    
    # Test 1: Basic draft/publish functionality
    if not run_command(
        'python test_draft_publish.py',
        'Test 1: Basic Draft/Publish Functionality'
    ):
        all_passed = False
    
    # Test 2: Comprehensive workflow tests
    if not run_command(
        'python test_draft_publish_workflow.py',
        'Test 2: Comprehensive Workflow Tests'
    ):
        all_passed = False
    
    # Test 3: Product service tests
    if not run_command(
        'python -m pytest test_products.py -v -k "draft or publish"',
        'Test 3: Product Service Tests (Draft/Publish)'
    ):
        all_passed = False
    
    # Print summary
    print("\n" + "=" * 70)
    if all_passed:
        print("✓ ALL TESTS PASSED!")
        print("=" * 70)
        print("\nTest Coverage:")
        print("  ✓ 13.1.1 - Create products in draft status")
        print("  ✓ 13.1.2 - Publish and unpublish products")
        print("  ✓ 13.1.3 - Draft products hidden from public")
        print("  ✓ 13.1.4 - Bulk publish/unpublish operations")
        print("  ✓ Data integrity and error handling")
        return 0
    else:
        print("✗ SOME TESTS FAILED")
        print("=" * 70)
        print("\nPlease review the test output above for details.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
