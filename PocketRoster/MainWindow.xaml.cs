using System;
using System.Windows;

namespace PocketChartDesktop
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            await PocketChartBrowser.EnsureCoreWebView2Async();

            PocketChartBrowser.CoreWebView2.Navigate(
                "https://pocketchart.onrender.com/"
            );
        }
    }
}