using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace EstruturasRepeticao01
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            int total = 2;
            for(int i = 0; i < 5; i += 1)
            {
                total = total * 2;
            }
            MessageBox.Show("O total é: " + total);
        }

        private void button2_Click(object sender, EventArgs e)
        {
            //int total = 1;
            //for(int i = 0; i < 1000; i += 1)
            //{
            //    MessageBox.Show("Contando: " + total = total+1);
            //}
        }
    }
}
