"""Setup script for development environment."""
import os
import sys
import subprocess


def create_directories():
    """Create necessary directories."""
    directories = [
        'models',
        'data',
        'logs'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✓ Created directory: {directory}")


def create_env_file():
    """Create .env file from example if it doesn't exist."""
    if not os.path.exists('.env'):
        if os.path.exists('.env.example'):
            with open('.env.example', 'r') as example:
                with open('.env', 'w') as env:
                    env.write(example.read())
            print("✓ Created .env file from .env.example")
            print("⚠ Please update .env with your configuration")
        else:
            print("✗ .env.example not found")
    else:
        print("✓ .env file already exists")


def install_dependencies():
    """Install Python dependencies."""
    print("\nInstalling dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✓ Dependencies installed successfully")
    except subprocess.CalledProcessError:
        print("✗ Failed to install dependencies")
        sys.exit(1)


def main():
    """Run setup."""
    print("Setting up Swati Jewellers Backend...\n")
    
    create_directories()
    create_env_file()
    
    response = input("\nInstall dependencies now? (y/n): ")
    if response.lower() == 'y':
        install_dependencies()
    
    print("\n✓ Setup complete!")
    print("\nNext steps:")
    print("1. Update .env with your configuration")
    print("2. Start MongoDB")
    print("3. Run: python run.py")


if __name__ == '__main__':
    main()
